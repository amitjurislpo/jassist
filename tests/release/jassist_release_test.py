"""Serves: the CTO's JurisAssist blog work order of 17 Nov 2026 (the data link behind the blog's approvals is released by
the Group's release worker, never from a person's machine), the Founding CTO's order of 11 Nov 2026 (built, deployed and
synced only through the release worker's limited role, never the Admin user), and the CTO's release safety rules of
17 Nov 2026 (Rule A trial beside then swap, Rule B no retry by itself, Rule C a hold on purpose). Tests the release
steps of scripts/release/jassist_release.py and watch.sh. Run: python3 tests/release/jassist_release_test.py"""
import importlib.util, json, os, tempfile, unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("rel", os.path.join(HERE, "..", "..", "scripts", "release", "jassist_release.py"))
rel = importlib.util.module_from_spec(spec); spec.loader.exec_module(rel)

S = "s" * 40
DOPPLER = {
    "prd": {"DATA_LINK_URL": "https://p", "DATA_LINK_SECRET": S, "DATALINK_DATABASE_URL": "postgres://p", "NEXT_PUBLIC_SANITY_PROJECT_ID": "abc",
            "RESEND_API_KEY": "re_1", "SANITY_API_WRITE_TOKEN": "sk", "SESSION_SECRET": "z", "IAMJCG_CONSUMER_CREDENTIAL": "",
            "VERCEL_TOKEN": "v", "OTHER": "x"},
    "stg": {"DATA_LINK_URL": "https://s", "DATA_LINK_SECRET": S, "DATALINK_DATABASE_URL": "postgres://s"},
}


class SiteSettings(unittest.TestCase):
    def test_the_sites_settings_go_into_the_data_link_and_nothing_needs_a_vercel_token(self):
        prd = rel.link_env("prd", DOPPLER["prd"])
        self.assertNotIn("IAMJCG_CONSUMER_CREDENTIAL", prd)  # empty in Doppler: not sent
        # only what the site reads through the link: never the site's own keys, nor any key the site does not read
        for never in ("VERCEL_TOKEN", "OTHER", "DATA_LINK_URL", "NEXT_PUBLIC_SANITY_PROJECT_ID", "RESEND_API_KEY", "SANITY_API_WRITE_TOKEN", "SESSION_SECRET"):
            self.assertNotIn(never, prd)
        with_cred = rel.link_env("prd", {**DOPPLER["prd"], "IAMJCG_CONSUMER_CREDENTIAL": "jwt"})
        self.assertEqual(with_cred["IAMJCG_CONSUMER_CREDENTIAL"], "jwt")
        self.assertEqual(set(rel.LINK_SETTINGS), {"IAMJCG_CONSUMER_CREDENTIAL"})
        src = open(os.path.join(HERE, "..", "..", "scripts", "release", "jassist_release.py")).read()
        self.assertNotIn("api.vercel.com", src)
        self.assertNotIn('get("VERCEL_TOKEN"', src)

    def test_the_release_carries_exactly_the_settings_the_site_reads_through_the_link(self):
        import re
        ts = open(os.path.join(HERE, "..", "..", "lib", "config", "linked-settings.ts")).read()
        names = re.search(r"LINKED_SETTINGS = \[([^\]]*)\]", ts).group(1)
        self.assertEqual(set(re.findall(r'"([A-Z0-9_]+)"', names)), set(rel.LINK_SETTINGS))

    def test_a_change_in_doppler_changes_the_digest_and_so_is_released(self):
        a = rel.settings_digest(DOPPLER)
        changed = {**DOPPLER, "prd": {**DOPPLER["prd"], "IAMJCG_CONSUMER_CREDENTIAL": "jwt"}}
        self.assertNotEqual(a, rel.settings_digest(changed))
        unrelated = {**DOPPLER, "prd": {**DOPPLER["prd"], "OTHER": "y"}}
        self.assertEqual(a, rel.settings_digest(unrelated))


class DataLink(unittest.TestCase):
    def test_each_function_gets_its_own_environment_and_database_login(self):
        self.assertEqual(rel.link_env("prd", DOPPLER["prd"]), {"JASSIST_ENVIRONMENT": "production", "DATABASE_URL": "postgres://p", "DATA_LINK_SECRET": S})
        self.assertEqual(rel.link_env("stg", DOPPLER["stg"])["JASSIST_ENVIRONMENT"], "preview")

    def test_a_missing_login_or_short_secret_stops_the_release(self):
        with self.assertRaises(rel.Stop):
            rel.link_env("prd", {**DOPPLER["prd"], "DATALINK_DATABASE_URL": ""})
        with self.assertRaises(rel.Stop):
            rel.link_env("prd", {**DOPPLER["prd"], "DATA_LINK_SECRET": "short"})


class LiveCheck(unittest.TestCase):
    def test_healthy_when_pages_answer_and_admin_goes_to_sita(self):
        # as the live site answers today: /admin goes to the site's own SITA sign-in start
        ans = {"/": (200, ""), "/blog": (200, ""), "/admin": (307, "https://www.jurisassistme.com/auth/sita/start?next=/admin")}
        self.assertTrue(rel.site_is_healthy(lambda p: ans[p])[0])

    def test_a_broken_page_or_an_open_admin_area_fails_the_check(self):
        ans = {"/": (500, ""), "/blog": (200, ""), "/admin": (307, "https://sita.x/")}
        self.assertFalse(rel.site_is_healthy(lambda p: ans[p])[0])
        ans = {"/": (200, ""), "/blog": (200, ""), "/admin": (200, "")}
        self.assertFalse(rel.site_is_healthy(lambda p: ans[p])[0])
        ans = {"/": (200, ""), "/blog": (502, ""), "/admin": (307, "/auth/sita/start")}
        self.assertFalse(rel.site_is_healthy(lambda p: ans[p])[0])


class LiveCheckPagesExist(unittest.TestCase):
    def test_the_pages_the_live_check_asks_for_are_the_sites_own(self):
        root = os.path.join(HERE, "..", "..")
        self.assertTrue(os.path.exists(os.path.join(root, "app", "blog", "route.ts")))
        admin = open(os.path.join(root, "app", "admin", "page.tsx")).read()
        self.assertIn('redirect("/auth/sita/start', admin)  # what makes /admin a redirect "to SITA"


class OnlyTheDeployerRole(unittest.TestCase):
    def test_it_takes_on_jassist_release_deployer_and_never_names_a_user(self):
        src = open(os.path.join(HERE, "..", "..", "scripts", "release", "jassist_release.py")).read()
        self.assertIn("role/jassist-release-deployer", src)
        self.assertNotIn(":user/", src)
        self.assertNotIn("--profile", src)


# ---- release safety (the CTO's words of 17 Nov 2026, 1:05 and 1:35 pm): Rule A (trial beside, then swap) and Rule B.

class FakeAws:
    """A stand-in for the AWS CLI: two live functions, and every call recorded. The trial function answers readiness
    as datalink/index.ts does: settings present, database reachable (DB_DOWN makes it unreachable)."""
    def __init__(self, db_up=True):
        self.live = {fn: {"code": b"OLD-" + fn.encode(), "env": {"DATABASE_URL": "postgres://old", "DATA_LINK_SECRET": S, "JASSIST_ENVIRONMENT": "x"}} for fn in ("jassist-datalink-prod", "jassist-datalink-preview")}
        self.calls, self.created, self.deleted, self.db_up, self.trials = [], [], [], db_up, {}
        self.version_bad = False
        self.alias, self.versions, self.has_alias = {fn: "1" for fn in self.live}, {fn: {"1": dict(v)} for fn, v in self.live.items()}, False

    def run(self, *a):
        self.calls.append(a)
        op = a[1]
        arg = lambda flag: a[a.index(flag) + 1]
        if op == "get-alias":
            if not self.has_alias:
                raise rel.Stop("aws lambda get-alias: ResourceNotFoundException")
            return {"FunctionVersion": self.alias[arg("--function-name")]}
        if op == "publish-version":
            fn = arg("--function-name"); v = str(len(self.versions[fn]) + 1)
            self.versions[fn][v] = {"code": self.live[fn]["code"], "env": dict(self.live[fn]["env"])}
            return {"Version": v}
        if op == "update-alias":
            self.alias[arg("--function-name")] = arg("--function-version"); return {}
        if op == "delete-log-group":
            return {}
        if op == "get-function" and arg("--function-name") not in self.live:
            if arg("--function-name") in self.trials:
                return {}
            raise rel.Stop("aws lambda get-function: ResourceNotFoundException")
        if op == "get-function":
            fn = arg("--function-name")
            return {"Configuration": {"CodeSha256": "sha-" + self.live[fn]["code"].decode(), "Environment": {"Variables": dict(self.live[fn]["env"])}, "Role": "arn:role", "Runtime": "nodejs22.x",
                                       "Handler": "index.handler", "Architectures": ["arm64"], "MemorySize": 256, "Timeout": 120, "VpcConfig": {"SubnetIds": ["s1"], "SecurityGroupIds": ["g1"]}},
                    "Code": {"Location": "http://signed"}}
        if op == "create-function":
            req = json.load(open(arg("--cli-input-json")[len("file://"):]))
            assert req["FunctionName"].startswith(rel.TRIAL_PREFIX)
            self.created.append(req["FunctionName"]); self.trials[req["FunctionName"]] = req["Environment"]["Variables"]
            return {}
        if op == "invoke":
            target = arg("--function-name")
            env = self.trials[target] if target in self.trials else self.live[target]["env"] if ":" not in target else self.versions[target.split(":")[0]][target.split(":")[1]]["env"]
            missing = [k for k in ("DATABASE_URL", "DATA_LINK_SECRET", "JASSIST_ENVIRONMENT") if not env.get(k)]
            if ":" in target and self.version_bad:
                missing = ["DATA_LINK_SECRET is missing"]
            if not missing and not self.db_up:
                missing = ["its database did not answer with its own login"]
            open(a[-1], "w").write(json.dumps({"statusCode": 503 if missing else 200, "body": json.dumps({"ok": not missing, "missing": missing})}))
            return {}
        if op == "delete-function":
            self.deleted.append(arg("--function-name")); self.trials.pop(arg("--function-name"), None); return {}
        if op == "update-function-code":
            self.live[arg("--function-name")]["code"] = open(arg("--zip-file")[len("fileb://"):], "rb").read(); return {}
        if op == "update-function-configuration":
            req = json.load(open(arg("--cli-input-json")[len("file://"):]))
            self.live[req["FunctionName"]]["env"] = req["Environment"]["Variables"]; return {}
        if op == "list-functions":
            return {"Functions": [{"FunctionName": n} for n in self.trials]}
        raise AssertionError(a)

    def wait_updated(self, fn): pass
    def wait_active(self, fn): pass
    def wait_version(self, fn, v): pass

    def alias_moves(self):
        return [c for c in self.calls if c[1] == "update-alias"]

    def live_touched(self):
        return [c for c in self.calls if c[1] in ("update-function-code", "update-function-configuration")]


class FakeResponse:
    def __init__(self, b): self.b = b
    def read(self): return self.b
    def __enter__(self): return self
    def __exit__(self, *a): return False


def run_release(aws, state, doppler=None, healthy=True, retry=(False, ""), new_zip=b"NEW", vercel=None, consume=(True, "Gopal")):
    """One release of tip T... with everything outside AWS stubbed; returns (exit/raised Stop, notices)."""
    notices = []
    args = type("A", (), {"repo": "/r", "tip": "t" * 40, "state": state, "slug": "o/r"})()
    dop = doppler or DOPPLER
    with mock.patch.object(rel, "Aws", lambda: aws), mock.patch.object(aws, "assume", lambda: None, create=True), \
         mock.patch.object(rel, "doppler_secrets", lambda t, c: dop[c]), mock.patch.dict(os.environ, {"DOPPLER_TOKEN": "x"}), \
         mock.patch.object(rel, "build_link", lambda *a: new_zip), mock.patch.object(rel, "production_is", vercel or (lambda *a, **k: None)), \
         mock.patch.object(rel, "site_is_healthy", lambda g: (healthy, "fine" if healthy else "/ answered 500, not 200")), \
         mock.patch.object(rel.time, "sleep", lambda s: None), \
         mock.patch.object(rel.urllib.request, "urlopen", lambda *a, **k: FakeResponse(b"saved")), \
         mock.patch.object(rel, "tell_merger", lambda slug, tip, text: notices.append(text)), \
         mock.patch.object(rel, "retry_asked", lambda slug, tip: retry), mock.patch.object(rel, "consume_retry", lambda *a: consume):
        rel.STEP[0] = 0
        try:
            return rel.release(args), notices
        except rel.Stop as e:
            return e, notices


DOPPLER_OK = {"prd": {**DOPPLER["prd"]}, "stg": {**DOPPLER["stg"]}}


class RuleATrialBesideThenSwap(unittest.TestCase):
    def test_a_version_that_is_not_ready_is_refused_and_the_live_functions_are_never_touched(self):
        # today's kind of fault: the new version cannot do its job (its database does not answer / a setting is gone)
        aws = FakeAws(db_up=False)
        with tempfile.TemporaryDirectory() as st:
            res, notices = run_release(aws, st)
            self.assertIsInstance(res, rel.Stop)
            self.assertIn("the new version was not ready", str(res))
            self.assertIn("the old one was never stopped", str(res))
            self.assertEqual(aws.live_touched(), [])  # no update-function-code or -configuration, ever
            self.assertEqual(aws.live["jassist-datalink-prod"]["code"], b"OLD-jassist-datalink-prod")
            self.assertEqual(aws.created, aws.deleted)  # the trial copy was removed
            self.assertTrue(aws.created)
            self.assertIn("step 4", open(os.path.join(st, "failed-release")).read())

    def test_a_missing_setting_in_the_trial_copy_is_refused(self):
        aws = FakeAws()
        why = rel.trial_copy(aws, {"role": "r", "runtime": "nodejs22.x", "handler": "h", "arch": ["arm64"], "memory": 256, "vpc": {"SubnetIds": ["s"], "SecurityGroupIds": ["g"]}},
                             b"zip", {"JASSIST_ENVIRONMENT": "production", "DATABASE_URL": "postgres://x"}, rel.TRIAL_PREFIX + "t")
        self.assertIn("DATA_LINK_SECRET", why)
        self.assertEqual(aws.created, aws.deleted)

    def test_the_trial_copy_has_no_route_and_no_background_work(self):
        aws = FakeAws()
        with tempfile.TemporaryDirectory() as st:
            run_release(aws, st)
        ops = {c[1] for c in aws.calls}
        self.assertFalse({"create-function-url-config", "create-alias", "add-permission", "publish-version"} & ops)  # nothing routes to it
        self.assertEqual(set(aws.trials), set())
        src = open(os.path.join(HERE, "..", "..", "datalink", "index.ts")).read() + open(os.path.join(HERE, "..", "..", "datalink", "handler.ts")).read()
        self.assertIn("event.jcgReadiness === true", src)       # it answers its readiness check only
        self.assertIn("!event.requestContext", src)             # never through the function URL
        for loop in ("setInterval", "setTimeout", "createServer"):
            self.assertNotIn(loop, src)                          # no loop, no timer: no background work to switch off

    def test_a_ready_version_is_swapped_exactly_as_before(self):
        aws = FakeAws()
        with tempfile.TemporaryDirectory() as st:
            res, notices = run_release(aws, st)
            self.assertEqual(res, 0)
            self.assertEqual(aws.live["jassist-datalink-prod"]["code"], b"NEW")
            self.assertEqual(aws.live["jassist-datalink-prod"]["env"]["DATABASE_URL"], "postgres://p")
            first_live_change = next(i for i, c in enumerate(aws.calls) if c[1].startswith("update-function"))
            self.assertTrue(all(i < first_live_change for i, c in enumerate(aws.calls) if c[1] in ("create-function", "invoke", "delete-function")))
            self.assertEqual(open(os.path.join(st, "last-released")).read().strip(), "t" * 40)

    def _stop_vercel(self, *a, **k):
        raise rel.Stop("Vercel's production build of x ended failure")

    def test_a_failed_site_build_puts_back_the_code_and_settings_saved_before(self):
        aws = FakeAws()
        before = json.loads(json.dumps({k: {"code": v["code"].decode(), "env": v["env"]} for k, v in aws.live.items()}))
        with tempfile.TemporaryDirectory() as st:
            res, notices = run_release(aws, st, vercel=self._stop_vercel)
            self.assertIsInstance(res, rel.Stop)
            self.assertIn("were put back", str(res))
            for fn, v in aws.live.items():
                self.assertEqual(v["env"], before[fn]["env"])              # configuration back
                self.assertEqual(v["code"], b"saved")                       # code back (what the fake download returned)
            self.assertEqual(read(st, "link-built"), "")
            self.assertFalse(os.path.exists(os.path.join(st, "last-released")))

    def test_a_settings_only_release_that_fails_the_live_check_is_put_back(self):
        aws = FakeAws()
        with tempfile.TemporaryDirectory() as st:
            open(os.path.join(st, "last-released"), "w").write("t" * 40 + "\n")  # same code, new settings
            res, _ = run_release(aws, st, healthy=False)
            self.assertIn("were put back", str(res))

    def test_a_vercel_timeout_puts_nothing_back(self):
        aws = FakeAws()
        def slow(*a, **k): raise rel.VercelTimeout("Vercel did not report in time")
        with tempfile.TemporaryDirectory() as st:
            res, _ = run_release(aws, st, vercel=slow)
            self.assertIn("nothing was put back", str(res))
            self.assertEqual(aws.live["jassist-datalink-prod"]["code"], b"NEW")

    def test_the_real_handler_answers_the_drills_poll_of_a_live_function(self):
        src = open(os.path.join(HERE, "..", "..", "datalink", "handler.ts")).read()
        self.assertNotIn("cfg.trial", src)  # a live function answers a direct readiness ask, as the drill needs

    def test_a_failed_live_check_after_the_new_site_is_live_puts_nothing_back_and_says_so(self):
        aws = FakeAws()
        with tempfile.TemporaryDirectory() as st:
            res, notices = run_release(aws, st, healthy=False)
            self.assertIn("the live check failed", str(res))
            self.assertIn("nothing was put back", str(res))
            self.assertNotIn("keeps the release it had", str(res) + notices[0])
            self.assertEqual(aws.live["jassist-datalink-prod"]["code"], b"NEW")


def read(st, name):
    try:
        return open(os.path.join(st, name)).read().strip()
    except OSError:
        return ""


class RuleBNotRetriedByItself(unittest.TestCase):
    def test_a_failed_release_is_recorded_told_and_not_tried_again_until_a_person_asks(self):
        with tempfile.TemporaryDirectory() as st:
            aws = FakeAws(db_up=False)
            res, notices = run_release(aws, st)
            self.assertIsInstance(res, rel.Stop)
            self.assertEqual(len(notices), 1)
            self.assertIn("not tried again by itself", notices[0])
            self.assertIn("state/retry/" + "t" * 12, notices[0])
            n_calls = len(aws.calls)
            for _ in range(3):  # later ticks do not try it again
                res, notices = run_release(aws, st)
                self.assertEqual(res, 0)
                self.assertEqual(notices, [])
            self.assertEqual(len(aws.calls), n_calls)

    def test_a_person_asks_by_the_retry_file_and_it_is_tried_exactly_once(self):
        with tempfile.TemporaryDirectory() as st:
            aws = FakeAws(db_up=False)
            run_release(aws, st)
            n = len(aws.calls)
            res, _ = run_release(aws, st, retry=(True, "blob1"))
            self.assertIsInstance(res, rel.Stop)       # tried once more, failed again
            self.assertGreater(len(aws.calls), n)
            n = len(aws.calls)
            run_release(aws, st)                         # the file was removed: no second try
            self.assertEqual(len(aws.calls), n)
            aws.db_up = True
            res, _ = run_release(aws, st, retry=(True, "blob1"))  # a genuine second ask (same content, same blob id) is honoured
            self.assertEqual(res, 0)

    def test_a_retry_file_that_cannot_be_removed_buys_no_try(self):
        with tempfile.TemporaryDirectory() as st:
            aws = FakeAws(db_up=False)
            run_release(aws, st)
            n = len(aws.calls)
            res, _ = run_release(aws, st, retry=(True, "b"), consume=(False, "Gopal"))
            self.assertEqual(res, 0)
            self.assertEqual(len(aws.calls), n)

    def test_a_tick_that_could_not_begin_is_not_an_attempt(self):
        class Dead(FakeAws):
            def run(self, *a):
                raise rel.Stop("aws sts get-caller-identity: no answer")
        with tempfile.TemporaryDirectory() as st:
            aws = Dead()
            args = type("A", (), {"repo": "/r", "tip": "t" * 40, "state": st, "slug": "o/r"})()
            with mock.patch.object(rel, "Aws", lambda: aws), mock.patch.object(aws, "assume", lambda: (_ for _ in ()).throw(rel.Stop("no answer")), create=True):
                with self.assertRaises(rel.Stop):
                    rel.release(args)
            self.assertEqual(read(st, "failed-release"), "")   # no failure record: the next look may begin

    def test_the_old_two_tries_rule_is_gone(self):
        src = open(os.path.join(HERE, "..", "..", "scripts", "release", "jassist_release.py")).read()
        self.assertNotIn("len(tries) >= 2", src)


class ZeroGap(unittest.TestCase):
    """The alias (infra/datalink main.tf): the trial copy proves the bundle, $LATEST is updated, a version is published and
    proven, and only then the alias moves."""
    def test_a_version_that_is_not_ready_never_moves_the_alias(self):
        aws = FakeAws(); aws.has_alias = True; aws.version_bad = True
        with tempfile.TemporaryDirectory() as st:
            res, _ = run_release(aws, st)
            self.assertIsInstance(res, rel.Stop)
            self.assertIn("the live alias was never moved", str(res))
            self.assertEqual(aws.alias_moves(), [])
            self.assertEqual(aws.alias, {"jassist-datalink-prod": "1", "jassist-datalink-preview": "1"})
            self.assertEqual(aws.live["jassist-datalink-prod"]["code"], b"saved")  # $LATEST put back as well

    def test_the_trial_copy_runs_first_even_when_the_alias_exists(self):
        aws = FakeAws(db_up=False); aws.has_alias = True
        with tempfile.TemporaryDirectory() as st:
            res, _ = run_release(aws, st)
            self.assertIn("the old one was never stopped", str(res))
            self.assertEqual(aws.live_touched(), [])  # $LATEST untouched: the old URL may still point at it

    def test_a_ready_version_moves_the_alias_after_the_proof(self):
        aws = FakeAws(); aws.has_alias = True
        with tempfile.TemporaryDirectory() as st:
            res, _ = run_release(aws, st)
            self.assertEqual(res, 0)
            self.assertEqual(aws.alias["jassist-datalink-prod"], "2")
            ops = [c[1] for c in aws.calls]
            self.assertLess(max(i for i, o in enumerate(ops) if o == "invoke"), min(i for i, o in enumerate(ops) if o == "update-alias"))

    def test_a_failed_site_build_moves_the_alias_straight_back(self):
        aws = FakeAws(); aws.has_alias = True
        def boom(*a, **k): raise rel.Stop("Vercel's production build ended failure")
        with tempfile.TemporaryDirectory() as st:
            res, _ = run_release(aws, st, vercel=boom)
            self.assertIn("were put back", str(res))
            self.assertEqual(aws.alias, {"jassist-datalink-prod": "1", "jassist-datalink-preview": "1"})

    def test_a_move_that_stops_half_way_is_put_back(self):
        aws = FakeAws(); aws.has_alias = True
        real = aws.run
        def flaky(*a):
            if a[1] == "update-alias" and a[a.index("--function-name") + 1] == "jassist-datalink-preview" and a[a.index("--function-version") + 1] == "2":
                raise rel.Stop("aws lambda update-alias: throttled")
            return real(*a)
        aws.run = flaky
        with tempfile.TemporaryDirectory() as st:
            res, _ = run_release(aws, st)
            self.assertIn("were put back", str(res))
            self.assertEqual(aws.alias, {"jassist-datalink-prod": "1", "jassist-datalink-preview": "1"})

    def test_an_error_other_than_no_such_alias_stops_the_release(self):
        aws = FakeAws(); real = aws.run
        aws.run = lambda *a: (_ for _ in ()).throw(rel.Stop("aws lambda get-alias: AccessDeniedException")) if a[1] == "get-alias" else real(*a)
        with tempfile.TemporaryDirectory() as st:
            res, _ = run_release(aws, st)
            self.assertIn("AccessDenied", str(res))
            self.assertEqual(aws.live_touched(), [])


class HoldOnPurpose(unittest.TestCase):
    """Rule C (the CTO, 17 Nov 2026, 3:15 pm): a hold placed on purpose never ends by itself. JurisAssist's release lock is a
    flock that ends when a run dies, so the hold is a separate file: <release home>/jassist/lock/hold. The worker is
    stood in for: stub flock and python3 record whether a release started."""
    WATCH = os.path.join(HERE, "..", "..", "scripts", "release", "watch.sh")

    def setUp(self):
        import subprocess
        self.sp = subprocess
        self.tmp = tempfile.mkdtemp()
        self.home = os.path.join(self.tmp, "home")
        self.lock = os.path.join(self.home, "jassist", "lock")
        self.bin = os.path.join(self.tmp, "bin"); os.makedirs(self.bin)
        for name, body in (("flock", "exit 0"), ("python3", f'echo released >> "{self.tmp}/released"')):
            f = os.path.join(self.bin, name); open(f, "w").write("#!/bin/sh\n" + body + "\n"); os.chmod(f, 0o755)

    def tick(self, *extra):
        env = {**os.environ, "PATH": self.bin + os.pathsep + os.environ["PATH"], "JCG_RELEASE_HOME": self.home}
        p = self.sp.run(["bash", self.WATCH, *extra], capture_output=True, text=True, env=env)
        return p, os.path.exists(os.path.join(self.tmp, "released"))

    def make_lock(self, hold, owner=None, old=False):
        os.makedirs(self.lock, exist_ok=True)
        if hold:
            open(os.path.join(self.lock, "hold"), "w").write("placed by a person, on the CTO's order\n")
        if owner is not None:
            open(os.path.join(self.lock, "owner"), "w").write(owner)
        if old:
            for f in os.listdir(self.lock):
                os.utime(os.path.join(self.lock, f), (1, 1))
            os.utime(self.lock, (1, 1))

    def assert_held_and_untouched(self):
        p, started = self.tick()
        self.assertFalse(started)
        self.assertIn(f"held on purpose ({self.lock}/hold); no release until a person lifts the hold", p.stdout)
        self.assertTrue(os.path.exists(os.path.join(self.lock, "hold")))  # nothing removed it

    def test_a_hold_with_no_holder_and_older_than_any_age_limit_still_holds(self):
        self.make_lock(True, old=True); self.assert_held_and_untouched()

    def test_a_hold_with_a_dead_holder_pid_still_holds(self):
        self.make_lock(True, owner="pid=999999 boot=same\n"); self.assert_held_and_untouched()

    def test_a_hold_with_another_boot_id_still_holds(self):
        self.make_lock(True, owner="pid=1 boot=some-other-boot\n", old=True); self.assert_held_and_untouched()

    def test_each_tick_logs_once_and_nothing_automatic_removes_it(self):
        self.make_lock(True)
        for _ in range(3):
            p, started = self.tick()
            self.assertEqual(p.stdout.count("held on purpose"), 1); self.assertFalse(started)
        self.assertTrue(os.path.exists(os.path.join(self.lock, "hold")))
        src = open(self.WATCH).read() + open(os.path.join(HERE, "..", "..", "scripts", "release", "jassist_release.py")).read()
        import re
        self.assertIsNone(re.search(r"\b(rm|mv|unlink|rmtree|os\.remove|os\.rename)\b[^\n]*(hold|HOLD|/lock)", src))

    def test_the_default_path_is_the_one_the_worker_sees(self):
        # the worker's tick exports JCG_RELEASE_HOME=/opt/jcg-release; a hand-run drill without it must look at the same folder
        src = open(self.WATCH).read()
        self.assertIn('HOME_DIR="${JCG_RELEASE_HOME:-/opt/jcg-release}/jassist"', src)
        self.assertIn("/opt/jcg-release/jassist/lock/hold", src)
        self.assertNotIn("/var/lib/jcg-release", src)

    def test_a_drill_is_not_run_while_held(self):
        self.make_lock(True)
        p, started = self.tick("--drill")
        self.assertEqual(p.returncode, 1); self.assertFalse(started)

    def test_the_same_locks_without_the_hold_file_do_not_stop_a_release(self):
        for owner, old in (("pid=999999 boot=same\n", False), ("pid=1 boot=other\n", True), (None, True)):
            self.make_lock(False, owner=owner, old=old)
            p, started = self.tick()
            self.assertTrue(started, owner)
            self.assertNotIn("held on purpose", p.stdout)
            os.remove(os.path.join(self.tmp, "released"))

    def test_after_the_folder_is_removed_by_hand_the_next_tick_releases(self):
        import shutil as sh
        self.make_lock(True)
        self.assertFalse(self.tick()[1])
        sh.rmtree(self.lock)  # a person's order, by hand
        p, started = self.tick()
        self.assertTrue(started); self.assertNotIn("held on purpose", p.stdout)


class TheDrill(unittest.TestCase):
    def test_the_drill_refuses_a_copy_missing_its_secret_leaves_nothing_and_never_touches_live(self):
        aws = FakeAws()
        with mock.patch.object(rel, "Aws", lambda: aws), mock.patch.object(aws, "assume", lambda: None, create=True), \
             mock.patch.object(rel, "site_is_healthy", lambda g: (True, "ok")), mock.patch.object(rel.time, "sleep", lambda s: None), \
             mock.patch.object(rel.urllib.request, "urlopen", lambda *a, **k: FakeResponse(b"saved")):
            self.assertEqual(rel.drill(None), 0)
        self.assertEqual(aws.live_touched(), [])
        self.assertEqual(aws.trials, {})


if __name__ == "__main__":
    unittest.main(verbosity=1)
