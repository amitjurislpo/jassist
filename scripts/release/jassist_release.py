"""JurisAssist's release steps (www.jurisassistme.com), run by the release worker through jassist-release-deployer.

Serves: the CTO's JurisAssist blog work order of 17 Nov 2026 (the data link the blog's approvals live behind), and the
Founding CTO's order of 11 Nov 2026, given for Juris Academy and applied to JurisAssist the same way: "Juris Academy is
built, deployed and synced only through the release worker's limited role, never the Admin user." Ported from Juris
Academy's scripts/release/academy_release.py; only the names, the one linked setting and the live-check pages differ. See scripts/release/watch.sh for the order of the steps.

Standard library only: the release worker carries python3, the AWS CLI, git and docker, and no Node.
Nothing secret is ever printed, logged or written to disk: Doppler's values live in this process's memory, go
to AWS through a private file deleted straight after the one call that needs it (the AWS CLI cannot read a
request from a pipe). Only digests are kept.

No Vercel token (the Founding CTO's order of 11 Nov 2026: "The site must receive its settings, including the
IamJCG credential, without any person creating a token or touching the Vercel dashboard"). The settings the site
gets from Doppler (LINK_SETTINGS) go into the data link Lambda's own environment, and the site reads them through
the data link's signed siteSettings request (lib/config/linked.ts). Vercel builds each merge to main itself.

Release safety, the Founding CTO's words of 17 Nov 2026 (1:05 pm and 1:35 pm): "A failed release must never take a
live service offline." / "the new version starts beside the old one, is proven ready, then swapped." / "A release
that fails is not retried by itself. It stops after the first failure and tells me. A person decides whether to try
again."
  Rule A: the new bundle with the new settings is first run as a temporary trial function (same network, no function
          URL, so no live route; it answers only its readiness check and does no other work). Not ready: it is
          removed and the release stops; the live function was never touched. If the live check after the update
          still fails, the code AND settings saved before the update are put back.
  Zero gap (once infra/datalink's alias "live" exists and the site's DATA_LINK_URL is the alias URL): the release updates
          $LATEST, which nothing routes to, publishes a version, proves that version ready by a direct invoke, and only
          then moves the alias; a failed live check moves it straight back.
  Rule B: one failure is recorded and not retried until a person creates state/retry/<sha12> on the repository's
          release-records branch.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone

ACCOUNT = "594566440066"
REGION = "us-east-1"
DEPLOYER = f"arn:aws:iam::{ACCOUNT}:role/jassist-release-deployer"
SITE = "https://www.jurisassistme.com"
DOPPLER_PROJECT = "juris_assist"
# Doppler config -> (Vercel target, data link function, the environment the function serves).
ENVIRONMENTS = {
    "prd": ("production", "jassist-datalink-prod", "production"),
    "stg": ("preview", "jassist-datalink-preview", "preview"),
}
# The settings the site reads through the data link (lib/config/linked-settings.ts, LINKED_SETTINGS, names the same
# one), so that they reach it with no Vercel token. Each is copied only when Doppler has a value for it.
LINK_SETTINGS = ("IAMJCG_CONSUMER_CREDENTIAL",)
NODE_IMAGE = "public.ecr.aws/docker/library/node:22-bookworm-slim"


def say(line: str) -> None:
    sys.stdout.write(f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} {line}\n")
    sys.stdout.flush()


class Stop(Exception):
    pass


class VercelTimeout(Stop):
    """Vercel's build did not report in time: it may still go live later, so nothing is put back."""


TOUCHED = [False]  # has any live function been changed yet in this release


# The step a release has reached, for the failure record (Rule B): "<sha> failed at step N".
STEPS = {1: "settings gate", 2: "build", 3: "saving what is live", 4: "trial copy", 5: "deploy", 6: "site build", 7: "live check"}
STEP = [0]


def at(n: int) -> None:
    STEP[0] = n


TRIAL_PREFIX = "jassist-datalink-trial-"
SHORT = {"production": "prod", "preview": "preview"}


# ---------------------------------------------------------------- pure parts (tested in tests/unit/release.test.ts)

def link_env(cfg: str, values: dict[str, str]) -> dict[str, str]:
    """The data link function's own environment, or Stop if Doppler lacks what it needs."""
    url, secret = values.get("DATALINK_DATABASE_URL", ""), values.get("DATA_LINK_SECRET", "")
    if not url or len(secret) < 32:
        raise Stop(f"{DOPPLER_PROJECT}/{cfg}: DATALINK_DATABASE_URL or DATA_LINK_SECRET (32+ characters) is missing")
    out = {"JASSIST_ENVIRONMENT": ENVIRONMENTS[cfg][2], "DATABASE_URL": url, "DATA_LINK_SECRET": secret}
    out.update({k: values[k] for k in LINK_SETTINGS if values.get(k)})
    return out


def settings_digest(secrets_by_config: dict[str, dict[str, str]]) -> str:
    """One digest of everything a release carries from Doppler, so a change there is released too."""
    parts = []
    for cfg in sorted(ENVIRONMENTS):
        v = secrets_by_config.get(cfg, {})
        for k in sorted(set(LINK_SETTINGS) | {"DATALINK_DATABASE_URL", "DATA_LINK_SECRET"}):
            parts.append(f"{cfg}\0{k}\0{v.get(k, '')}")
    return hashlib.sha256("\n".join(parts).encode()).hexdigest()


def site_is_healthy(get) -> tuple[bool, str]:
    """The live checks: the home page and the blog (whose approvals the data link holds) answer 200; the admin area
    sends people to SITA sign-in."""
    for path, want in (("/", 200), ("/blog", 200)):
        status, _ = get(path)
        if status != want:
            return False, f"{path} answered {status}, not {want}"
    status, location = get("/admin")
    if status not in (302, 303, 307, 308) or "sita" not in (location or "").lower():
        return False, f"/admin answered {status} to {location or 'nowhere'}, not a redirect to SITA sign-in"
    return True, "home 200, blog 200, admin redirects to SITA"


# ---------------------------------------------------------------- AWS, as jassist-release-deployer

class Aws:
    def __init__(self) -> None:
        self.env = dict(os.environ)

    def assume(self) -> None:
        out = self.run("sts", "assume-role", "--role-arn", DEPLOYER, "--role-session-name", "jassist-release",
                       "--duration-seconds", "3600")
        c = out["Credentials"]
        self.env.pop("AWS_PROFILE", None)
        self.env.update(AWS_ACCESS_KEY_ID=c["AccessKeyId"], AWS_SECRET_ACCESS_KEY=c["SecretAccessKey"], AWS_SESSION_TOKEN=c["SessionToken"])
        who = self.run("sts", "get-caller-identity")["Arn"]
        if ":assumed-role/jassist-release-deployer/" not in who:
            raise Stop(f"running as {who}, not jassist-release-deployer")

    def run(self, *args: str) -> dict:
        p = subprocess.run(["aws", *args, "--region", REGION, "--output", "json"], capture_output=True, text=True,
                           timeout=300, env=self.env)
        if p.returncode != 0:
            last = (p.stderr.strip().splitlines() or ["no answer"])[-1]
            raise Stop(f"aws {args[0]} {args[1]}: {last[:300]}")
        return json.loads(p.stdout) if p.stdout.strip() else {}

    def wait_updated(self, fn: str) -> None:
        p = subprocess.run(["aws", "lambda", "wait", "function-updated", "--function-name", fn, "--region", REGION],
                           env=self.env, timeout=600, capture_output=True)
        if p.returncode != 0:
            raise Stop(f"{fn} did not finish updating")


    def wait_version(self, fn: str, v: str) -> None:
        p = subprocess.run(["aws", "lambda", "wait", "published-version-active", "--function-name", fn, "--qualifier", v, "--region", REGION],
                           env=self.env, timeout=600, capture_output=True)
        if p.returncode != 0:
            raise Stop(f"{fn} version {v} did not become active")

    def wait_active(self, fn: str) -> None:
        p = subprocess.run(["aws", "lambda", "wait", "function-active-v2", "--function-name", fn, "--region", REGION],
                           env=self.env, timeout=600, capture_output=True)
        if p.returncode != 0:
            raise Stop(f"the trial copy {fn} did not become active")


def doppler_secrets(token: str, cfg: str) -> dict[str, str]:
    q = urllib.parse.urlencode({"project": DOPPLER_PROJECT, "config": cfg, "format": "json"})
    req = urllib.request.Request(f"https://api.doppler.com/v3/configs/config/secrets/download?{q}",
                                 headers={"authorization": f"Bearer {token}", "accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read())


def live_get(path: str) -> tuple[int, str]:
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None
    opener = urllib.request.build_opener(NoRedirect)
    try:
        with opener.open(urllib.request.Request(f"{SITE}{path}", headers={"cache-control": "no-cache"}), timeout=30) as r:
            return r.status, r.headers.get("location", "")
    except urllib.error.HTTPError as err:
        return err.code, err.headers.get("location", "")
    except Exception:
        return 0, ""


# ---------------------------------------------------------------- the data link

def build_link(repo: str, tip: str, state: str) -> bytes:
    """Builds the data link once, from this commit, in a throwaway Node container."""
    work = tempfile.mkdtemp(prefix="jassist-link-")
    try:
        subprocess.run(["git", "-C", repo, "worktree", "add", "-q", "--detach", f"{work}/src", tip], check=True, capture_output=True)
        cache = os.path.join(state, "npm-cache")
        os.makedirs(cache, exist_ok=True)
        p = subprocess.run(["docker", "run", "--rm", "-v", f"{work}/src:/src", "-v", f"{cache}:/root/.npm", "-w", "/src",
                            "-e", "DATALINK_NO_ZIP=1", NODE_IMAGE, "sh", "-c",
                            "npm ci --no-audit --no-fund --ignore-scripts >/dev/null && node datalink/build.mjs"],
                           capture_output=True, text=True, timeout=1200)
        if p.returncode != 0:
            raise Stop(f"the data link did not build: {(p.stderr.strip().splitlines() or ['no output'])[-1][:300]}")
        bundle = os.path.join(work, "src", "dist", "datalink", "index.mjs")
        zpath = os.path.join(work, "datalink.zip")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            info = zipfile.ZipInfo("index.mjs", date_time=(2026, 1, 1, 0, 0, 0))
            info.external_attr = 0o644 << 16
            with open(bundle, "rb") as f:
                z.writestr(info, f.read(), zipfile.ZIP_DEFLATED)
        with open(zpath, "rb") as f:
            return f.read()
    finally:
        subprocess.run(["git", "-C", repo, "worktree", "remove", "--force", f"{work}/src"], capture_output=True)
        shutil.rmtree(work, ignore_errors=True)


def deploy_link(aws: Aws, zipped: bytes | None, secrets_by_config: dict[str, dict[str, str]]) -> None:
    TOUCHED[0] = True
    with tempfile.TemporaryDirectory(prefix="jassist-link-") as d:
        os.chmod(d, 0o700)
        for cfg, (_target, fn, _env) in ENVIRONMENTS.items():
            if zipped is not None:
                zpath = os.path.join(d, "code.zip")
                with open(zpath, "wb") as f:
                    f.write(zipped)
                aws.run("lambda", "update-function-code", "--function-name", fn, "--zip-file", f"fileb://{zpath}")
                aws.wait_updated(fn)
            req = os.path.join(d, "config.json")
            fd = os.open(req, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            with os.fdopen(fd, "w") as f:
                json.dump({"FunctionName": fn, "Environment": {"Variables": link_env(cfg, secrets_by_config[cfg])}}, f)
            try:
                aws.run("lambda", "update-function-configuration", "--cli-input-json", f"file://{req}")
            finally:
                os.remove(req)
            aws.wait_updated(fn)
            say(f"data link {fn}: {'code and ' if zipped is not None else ''}secrets deployed")


# ---------------------------------------------------------------- release safety, Rule A (trial beside, then swap)

def private_json(d: str, name: str, value: dict) -> str:
    """A request file only this process can read, for the one call that needs it (the AWS CLI cannot read from a pipe)."""
    path = os.path.join(d, name)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump(value, f)
    return path


def snapshot(aws: Aws, fn: str) -> dict:
    """What is live right now: its code (the zip) and its whole configuration, in memory only, to put back."""
    got = aws.run("lambda", "get-function", "--function-name", fn)
    conf = got["Configuration"]
    with urllib.request.urlopen(got["Code"]["Location"], timeout=120) as res:  # a short-lived signed address, never printed
        code = res.read()
    return {"fn": fn, "code": code, "sha": conf.get("CodeSha256", ""), "env": dict((conf.get("Environment") or {}).get("Variables") or {}),
            "role": conf["Role"], "runtime": conf["Runtime"], "handler": conf["Handler"], "arch": conf.get("Architectures", ["arm64"]),
            "memory": conf["MemorySize"], "timeout": conf["Timeout"], "vpc": conf.get("VpcConfig") or {}}


def readiness_reason(payload: dict | None) -> str:
    """Plain reason from the trial copy's answer; "" means ready."""
    if not isinstance(payload, dict):
        return "the trial copy gave no answer"
    body = payload.get("body")
    try:
        data = json.loads(body) if isinstance(body, str) else {}
    except ValueError:
        data = {}
    if payload.get("statusCode") == 200 and data.get("ok") is True:
        return ""
    if isinstance(data.get("missing"), list) and data["missing"]:
        return "; ".join(str(m) for m in data["missing"])[:300]
    if "errorMessage" in payload:
        return "the trial copy failed to start"
    return f"the trial copy answered {payload.get('statusCode')}, not ready"


def invoke_readiness(aws: Aws, target: str) -> str:
    """Asks a function (or a version of it) if it is ready by a direct invoke; "" means ready."""
    with tempfile.TemporaryDirectory(prefix="jassist-ready-") as d:
        out = os.path.join(d, "answer.json")
        aws.run("lambda", "invoke", "--function-name", target, "--cli-binary-format", "raw-in-base64-out",
                "--payload", json.dumps({"jcgReadiness": True}), out)
        with open(out) as f:
            return readiness_reason(json.load(f))


def trial_copy(aws: Aws, snap: dict, zipped: bytes, env: dict[str, str], name: str) -> str:
    """Runs the new bundle with the new settings as a temporary function beside the live one: the live function's own
    role and network (so it reaches its database as it will), NO function URL and NO alias, background work off (a data
    link Lambda has none, and JASSIST_TRIAL=1 makes it answer its readiness check only). Always removed. Returns the
    reason it is not ready, or "" when it is."""
    reason = ""
    with tempfile.TemporaryDirectory(prefix="jassist-trial-") as d:
        os.chmod(d, 0o700)
        zpath = os.path.join(d, "code.zip")
        with open(zpath, "wb") as f:
            f.write(zipped)
        vpc = {"SubnetIds": snap["vpc"].get("SubnetIds", []), "SecurityGroupIds": snap["vpc"].get("SecurityGroupIds", [])}
        req = private_json(d, "create.json", {
            "FunctionName": name, "Role": snap["role"], "Runtime": snap["runtime"], "Handler": snap["handler"],
            "Architectures": snap["arch"], "MemorySize": snap["memory"], "Timeout": 60, "VpcConfig": vpc,
            "Description": "JurisAssist release trial copy: answers its readiness check only; removed straight after",
            "Environment": {"Variables": {**env, "JASSIST_TRIAL": "1"}},
        })
        try:
            aws.run("lambda", "create-function", "--cli-input-json", f"file://{req}", "--zip-file", f"fileb://{zpath}")
            os.remove(req)
            aws.wait_active(name)
            out = os.path.join(d, "answer.json")
            aws.run("lambda", "invoke", "--function-name", name, "--cli-binary-format", "raw-in-base64-out",
                    "--payload", json.dumps({"jcgReadiness": True}), out)
            with open(out) as f:
                reason = readiness_reason(json.load(f))
        finally:
            if os.path.exists(req):
                os.remove(req)
            try:
                aws.run("lambda", "delete-function", "--function-name", name)
            except Stop:
                reason = (reason + "; " if reason else "") + "the trial copy could not be removed"
            try:  # its log group would otherwise never expire
                aws.run("logs", "delete-log-group", "--log-group-name", f"/aws/lambda/{name}")
            except Stop:
                pass
    return reason


def trial_all(aws: Aws, snaps: dict[str, dict], zipped: bytes | None, secrets_by_config: dict, tip: str) -> None:
    """Rule A. Every environment's new version, with its new settings, must be ready before any live function is touched."""
    for cfg, (_t, fn, env_name) in ENVIRONMENTS.items():
        snap = snaps[fn]
        code = zipped if zipped is not None else snap["code"]
        why = trial_copy(aws, snap, code, link_env(cfg, secrets_by_config[cfg]), f"{TRIAL_PREFIX}{SHORT[env_name]}-{tip[:12]}")
        if why:
            raise Stop(f"the new version was not ready: {fn}: {why}; the old one was never stopped")
        say(f"trial copy of {fn}: ready, removed")


ALIAS = "live"


def alias_versions(aws: Aws) -> dict[str, str] | None:
    """The version each live alias serves now, or None when the alias is not there yet (then the trial copy above is used)."""
    out = {}
    for (_t, fn, _e) in ENVIRONMENTS.values():
        try:
            out[fn] = aws.run("lambda", "get-alias", "--function-name", fn, "--name", ALIAS)["FunctionVersion"]
        except Stop as err:
            if "ResourceNotFoundException" in str(err):
                return None
            raise  # any other answer is not "no alias": the release stops rather than guess
    return out


def prove_versions(aws: Aws) -> dict[str, str]:
    """Zero gap: publishes what $LATEST now holds as a version and proves each version ready (settings present, its
    database reachable) by a direct invoke. The alias, which the site's address points at, has not moved."""
    versions = {}
    for (_t, fn, _e) in ENVIRONMENTS.values():
        v = aws.run("lambda", "publish-version", "--function-name", fn)["Version"]
        aws.wait_version(fn, v)
        why = invoke_readiness(aws, f"{fn}:{v}")
        if why:
            raise Stop(f"the new version was not ready: {fn} version {v}: {why}; the live alias was never moved")
        versions[fn] = v
        say(f"{fn} version {v}: ready")
    return versions


def move_aliases(aws: Aws, to: dict[str, str]) -> None:
    for fn, v in to.items():
        aws.run("lambda", "update-alias", "--function-name", fn, "--name", ALIAS, "--function-version", v)
        say(f"data link {fn}: alias {ALIAS} now serves version {v}")


def restore_link(aws: Aws, snaps: dict[str, dict]) -> list[str]:
    """Puts back the code AND settings saved before the update. Tries every function; returns what could not be put back."""
    failed = []
    with tempfile.TemporaryDirectory(prefix="jassist-restore-") as d:
        os.chmod(d, 0o700)
        for fn, snap in snaps.items():
            try:
                zpath = os.path.join(d, "code.zip")
                with open(zpath, "wb") as f:
                    f.write(snap["code"])
                aws.run("lambda", "update-function-code", "--function-name", fn, "--zip-file", f"fileb://{zpath}")
                aws.wait_updated(fn)
                req = private_json(d, "config.json", {"FunctionName": fn, "Environment": {"Variables": snap["env"]}})
                try:
                    aws.run("lambda", "update-function-configuration", "--cli-input-json", f"file://{req}")
                finally:
                    os.remove(req)
                aws.wait_updated(fn)
                say(f"data link {fn}: the code and settings saved before the update are back")
            except Exception as err:
                failed.append(f"{fn}: {str(err)[:120]}")
    return failed


# ---------------------------------------------------------------- release safety, Rule B (not retried by itself)

def failure_record(args_state: str) -> str:
    return read_state(args_state, "failed-release")


def retry_asked(slug: str, tip: str) -> tuple[bool, str]:  # noqa
    """A person asks for one more try by creating state/retry/<sha12> on release-records (GitHub web or API), with one
    line saying who asks. Returns (asked, the file's blob id, so one file buys exactly one try)."""
    p = subprocess.run(["gh", "api", f"repos/{slug}/contents/state/retry/{tip[:12]}?ref=release-records", "--jq", ".sha"],
                       capture_output=True, text=True, timeout=60)
    blob = p.stdout.strip()
    return (True, blob) if p.returncode == 0 and blob else (False, "")


def consume_retry(slug: str, tip: str, blob: str) -> tuple[bool, str]:
    """Removes the retry file, so one file buys exactly one try. Returns (removed, the line saying who asked). The try
    goes ahead only if the removal succeeded: a file that cannot be removed would otherwise buy a try at every look."""
    p = subprocess.run(["gh", "api", f"repos/{slug}/contents/state/retry/{tip[:12]}?ref=release-records", "--jq", ".content"],
                       capture_output=True, text=True, timeout=60)
    try:
        import base64
        who = base64.b64decode(p.stdout.strip()).decode().strip().splitlines()[0][:100]
    except Exception:
        who = "a person (the file said no name)"
    d = subprocess.run(["gh", "api", "-X", "DELETE", f"repos/{slug}/contents/state/retry/{tip[:12]}", "-f", "branch=release-records",
                        "-f", f"message=retry of {tip[:12]} taken: {who}", "-f", f"sha={blob}"], capture_output=True, text=True, timeout=60)
    return d.returncode == 0, who


# ---------------------------------------------------------------- the release

def read_state(state: str, name: str) -> str:
    try:
        with open(os.path.join(state, name)) as f:
            return f.read().strip()
    except OSError:
        return ""


def write_state(state: str, name: str, value: str) -> None:
    with open(os.path.join(state, name), "w") as f:
        f.write(value + "\n")


def tell_merger(slug: str, tip: str, text: str) -> None:
    pr = subprocess.run(["gh", "api", f"repos/{slug}/commits/{tip}/pulls", "--jq", "[.[] | select(.merged_at != null)][0] | \"\\(.number) \\(.merged_by.login // .user.login)\""],
                        capture_output=True, text=True, timeout=60)
    parts = pr.stdout.strip().split()
    if pr.returncode == 0 and len(parts) == 2 and parts[0].isdigit():
        subprocess.run(["gh", "pr", "comment", parts[0], "-R", slug, "--body", f"@{parts[1]} {text}"], capture_output=True, timeout=60)


def release(args) -> int:
    aws = Aws()
    aws.assume()
    secrets_by_config: dict[str, dict[str, str]] = {}
    # The release worker's own Doppler access, which its launch holds in memory (DOPPLER_TOKEN); nothing new is stored.
    token = os.environ.get("DOPPLER_TOKEN", "")
    if not token:
        raise Stop("the release worker's Doppler access (DOPPLER_TOKEN) is not in its environment")
    for cfg in ENVIRONMENTS:
        secrets_by_config[cfg] = doppler_secrets(token, cfg)
    token = ""
    digest = settings_digest(secrets_by_config)
    last, last_digest = read_state(args.state, "last-released"), read_state(args.state, "settings-digest")
    new_code = last != args.tip
    new_settings = last_digest != digest
    if not new_code and not new_settings:
        return 0
    attempt = f"{args.tip} {digest}"
    # Rule B: a release that failed is not tried again by itself. A person asks, once, with state/retry/<sha12> on
    # release-records; a newer merge (another tip) or changed settings (another digest) is a new release as before.
    rec = failure_record(args.state).split(" ", 2)
    if len(rec) >= 3 and f"{rec[0]} {rec[1]}" == attempt:
        asked, blob = retry_asked(args.slug, args.tip)
        if not asked:
            say(f"{args.tip[:12]} failed at {rec[2]}; not tried again until a person asks")
            return 0
        removed, who = consume_retry(args.slug, args.tip, blob)
        if not removed:
            say(f"{args.tip[:12]} failed at {rec[2]}; a retry was asked by {who} but its file could not be removed, so it is not tried (it would repeat at every look); not tried again until the file is removed")
            return 0
        say(f"{args.tip[:12]}: a retry was asked by {who}; trying once")
    say(f"releasing {args.tip[:12]}: {'new code' if new_code else 'same code'}, {'new settings' if new_settings else 'same settings'}")
    at(1)
    TOUCHED[0] = False
    try:
        return _release(args, aws, secrets_by_config, digest, new_code)
    except Exception as err:  # the first failure at any step is recorded; nothing retries it by itself
        if not isinstance(err, Stop):
            err = Stop(f"{type(err).__name__}: {str(err)[:200]}")
        where = f"step {STEP[0]} ({STEPS.get(STEP[0], '?')})"
        write_state(args.state, "failed-release", f"{args.tip} {digest} {where}")
        tell_merger(args.slug, args.tip, f"the release of `{args.tip[:12]}` failed at {where}: {str(err)[:300]}.{'' if TOUCHED[0] else ' Nothing live was touched.'} It is not tried again by itself. To ask for one more try, add a file `state/retry/{args.tip[:12]}` on the `release-records` branch with one line saying who asks.")
        raise err from None


def _release(args, aws: Aws, secrets_by_config: dict, digest: str, new_code: bool) -> int:
    # 1. The settings gate: everything the data link needs must be in Doppler (Stop names what is missing).
    for cfg in ENVIRONMENTS:
        link_env(cfg, secrets_by_config[cfg])
    # 2. The data link: built once from this commit (Vercel's build of the same merge waits for it).
    at(2)
    zipped = build_link(args.repo, args.tip, args.state) if read_state(args.state, "link-built") != args.tip else None
    # 3. What is live now, saved in memory so it can be put back.
    at(3)
    snaps = {fn: snapshot(aws, fn) for (_t, fn, _e) in ENVIRONMENTS.values()}
    # 4. Rule A: the new bundle with the new settings, proven ready BESIDE the live one. Not ready: the release stops
    # here, and nothing the site reaches has been touched.
    at(4)
    current = alias_versions(aws)  # None until the alias exists
    # Always a trial copy first: the site's address may still be the old URL (on $LATEST) until it has been moved to the
    # alias URL and the old URL removed, so $LATEST must never be updated before the new version is proven.
    trial_all(aws, snaps, zipped, secrets_by_config, args.tip)
    # 5. The swap. From here, any failure puts back the code and settings saved in step 3 (and the alias, if it moved).
    at(5)
    moved = False
    try:
        deploy_link(aws, zipped, secrets_by_config)  # with an alias, this is $LATEST, which nothing routes to
        if current is not None:
            at(4)
            versions = prove_versions(aws)
            at(5)
            moved = True  # set first: a move that stops half way is still put back
            move_aliases(aws, versions)
        write_state(args.state, "link-built", args.tip)
        # 6. New code: Vercel's own build of this merge must be the live production deployment before it is called live.
        at(6)
        if new_code:
            production_is(args.slug, args.tip)
        # 7. The live check.
        at(7)
        ok, why = False, "not checked"
        for _ in range(6):
            ok, why = site_is_healthy(live_get)
            if ok:
                break
            time.sleep(20)
        if not ok:
            raise Stop(f"the live check failed: {why}")
    except Exception as err:
        if not isinstance(err, Stop):
            err = Stop(f"{type(err).__name__}: {str(err)[:200]}")
        # Put back only while the old site is still the one serving: a deploy failure, a failed Vercel build (steps 5, 6),
        # or a settings-only release. After a new site went live (step 7), putting back only the data link would pair the
        # new site with the old data link, so nothing is put back and the notice says so.
        if (STEP[0] >= 7 or isinstance(err, VercelTimeout)) and new_code:
            raise Stop(f"{err}; the new site and the new data link are both live, so nothing was put back (putting back only the data link could pair a new site with the old data link; a timed-out site build may still go live). A person decides") from None
        left = []
        if moved and current is not None:
            try:
                move_aliases(aws, current)
            except Exception as e2:
                left.append(f"alias: {str(e2)[:120]}")
        left += restore_link(aws, snaps)
        write_state(args.state, "link-built", "")  # the next real attempt builds again
        if left:
            raise Stop(f"{err}; and the saved code and settings could NOT all be put back ({'; '.join(left)})") from None
        raise Stop(f"{err}; the code and settings saved before the update were put back, and production keeps the release it had") from None

    # 8. The record.
    write_state(args.state, "last-released", args.tip)
    write_state(args.state, "settings-digest", digest)
    say(f"LIVE: {args.tip[:12]} at {SITE}; {why}")
    if new_code:
        tell_merger(args.slug, args.tip, f"live in production: JurisAssist `{args.tip[:12]}` at {SITE}, {datetime.now(timezone.utc).strftime('%H:%MZ')}. Data link released by the release worker through jassist-release-deployer.")
    return 0


def production_is(slug: str, tip: str, limit: int = 1800) -> None:
    """Waits until Vercel reports its build of this commit (a production deployment, on main) completed: the commit
    status Vercel posts on GitHub, context "Vercel". Never claims live before that."""
    start = time.time()
    while time.time() - start < limit:
        p = subprocess.run(["gh", "api", f"repos/{slug}/commits/{tip}/status", "--jq",
                            '[.statuses[] | select(.context == "Vercel")][0].state // empty'], capture_output=True, text=True, timeout=60)
        st = p.stdout.strip()
        if st == "success":
            return
        if st in ("failure", "error"):
            raise Stop(f"Vercel's production build of {tip[:12]} ended {st}; production keeps the release it had")
        time.sleep(20)
    raise VercelTimeout(f"Vercel did not report its production build of {tip[:12]} complete in {limit} s")


def aws_has(aws: Aws, name: str) -> bool:
    """Does a function of this name still exist (get-function on its own name; ResourceNotFound means gone)."""
    try:
        aws.run("lambda", "get-function", "--function-name", name)
        return True
    except Stop as err:
        if "ResourceNotFound" in str(err):
            return False
        raise


def drill(args) -> int:
    """The drill, run on the release worker after LIVE (never from a laptop): starts a trial copy of the CURRENT live
    code with ONE required setting removed, shows it refused, removes it, and shows the live site answered
    throughout (polled every second). It never stops, restarts or changes a live function, and leaves nothing behind."""
    import threading
    aws = Aws()
    aws.assume()
    fn = ENVIRONMENTS["prd"][1]
    before = snapshot(aws, fn)
    stop, bad, total, trial_names = threading.Event(), [0], [0], []

    def poll() -> None:
        while not stop.is_set():
            ok, _ = site_is_healthy(live_get)
            if ok:  # and the data link itself: a direct readiness ask of the live function (reads nothing sensitive)
                try:
                    ok = invoke_readiness(aws, fn) == ""
                except Exception:
                    ok = False
            total[0] += 1
            bad[0] += 0 if ok else 1
            stop.wait(1)

    t = threading.Thread(target=poll)
    t.start()
    try:
        env = {k: v for k, v in before["env"].items() if k != "DATA_LINK_SECRET"}  # the one setting taken away
        trial_names.append(f"{TRIAL_PREFIX}drill-{int(time.time())}")
        why = trial_copy(aws, before, before["code"], env, trial_names[0])
    finally:
        stop.set()
        t.join()
    after = snapshot(aws, fn)
    left = [n for n in trial_names if aws_has(aws, n)]
    untouched = before["sha"] == after["sha"] and before["env"] == after["env"]
    say(f"DRILL: trial copy without DATA_LINK_SECRET {'REFUSED: ' + why if why else 'was NOT refused'}")
    say(f"DRILL: live checks {total[0]}, failures={bad[0]}; live function untouched={untouched}; trial copies left behind={len(left)}")
    return 0 if ("DATA_LINK_SECRET" in why and bad[0] == 0 and untouched and not left) else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo")
    ap.add_argument("--tip")
    ap.add_argument("--state")
    ap.add_argument("--slug")
    ap.add_argument("--drill", action="store_true", help="prove a trial copy missing a setting is refused while the live site answers")
    args = ap.parse_args()

    def on_term(signum, frame):  # launch.sh's time limit: raise, so the trial copy is removed and the failure recorded
        raise Stop("the release was stopped by the worker's time limit")
    signal.signal(signal.SIGTERM, on_term)
    try:
        if args.drill:
            return drill(args)
        if not (args.repo and args.tip and args.state and args.slug):
            raise Stop("--repo, --tip, --state and --slug are required")
        return release(args)
    except Exception as err:
        again = "it is not tried again by itself" if STEP[0] else "nothing was begun, so the next look tries again"
        say(f"STOPPED: {err}. {again[0].upper()}{again[1:]}.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
