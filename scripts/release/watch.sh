#!/usr/bin/env bash
# JurisAssist's release — run by the Group's release worker (jcg-release-worker), never by a person.
#
# Serves: the CTO's JurisAssist blog work order of 17 Nov 2026, and the Founding CTO's order of 11 Nov 2026, given
# for Juris Academy and applied to JurisAssist the same way: "Juris Academy is built, deployed and synced only through
# the release worker's limited role, never the Admin user." Ported from Juris Academy's scripts/release/watch.sh.
# The worker's tick (tanhakris/paracounsel-lie scripts/release/worker/tick.sh, part_jassist) checks that every commit
# on main came through a merged PR, then runs this file from main. Everything below runs as jassist-release-deployer,
# which only the worker's role may take on (infra/datalink/release.tf).
#
# One look: if main has a commit not yet released, or juris_assist's settings in Doppler changed, it
#   1. builds the data link once, from that commit, proves it ready as a trial copy, and deploys it to both functions
#      with their secrets and the settings the site reads through it (LINK_SETTINGS; no Vercel token). Vercel's own
#      build of the same merge waits for it (scripts/vercel-build.mjs);
#   2. waits for Vercel's production build of that commit (its "Vercel" status on GitHub);
#   3. checks the live site (https://www.jurisassistme.com); a failed check before the new site is live puts back the
#      data link code and settings saved before;
#   4. records it, and tells the person who merged that it is live.
# Nothing secret is printed or logged. A look with nothing new costs a few reads.
#
# Release safety, the CTO's words of 17 Nov 2026 (1:05 and 1:35 pm):
#   Rule A: step 1 above starts with a trial copy of the new data link beside the live one, proven ready (settings
#   present, its database reachable); only then are the live functions touched; if the live check still fails, the
#   code and settings saved before are put back (jassist_release.py).
#   Rule B: "A release that fails is not retried by itself. It stops after the first failure and tells me. A person
#   decides whether to try again." A failed release of a commit is recorded and the tick's log says "<sha> failed at
#   step N; not tried again until a person asks". A person asks by creating state/retry/<sha12> on this repository's
#   release-records branch (one line: who asks); the next look tries once and removes the file. A look that could not
#   even begin (no AWS role, no Doppler) is not an attempt and tries again at the next look.
#   Drill, run on the worker after LIVE:  bash scripts/release/watch.sh --drill
#
# A hold placed on purpose (the CTO, 17 Nov 2026, 3:15 pm: "A hold placed on purpose never ends by itself, whatever its
# age, and whether or not the worker restarts. Only an order lifts it. A stale lock left by a crashed release can still be
# cleared as now, but the two must never be confused."): a person puts a file named `hold` in
#   /opt/jcg-release/jassist/lock/hold (JCG_RELEASE_HOME, default /opt/jcg-release)     (what is in it: who placed it, on whose order)
# and no release starts while it exists. Nothing here ever removes it; only a person's order lifts it, by removing the
# lock folder by hand (over SSM), and the order is recorded. Its content is never executed or sent anywhere. This is not
# the flock below: that lock (state/.lock) ends by itself when a run dies, and is a release's own lock, never a hold.
set -uo pipefail
HOME_DIR="${JCG_RELEASE_HOME:-/opt/jcg-release}/jassist"
HOLD="$HOME_DIR/lock/hold"
# FIRST, before anything else in the tick: no age, pid, boot id or restart ends a hold.
if [ -e "$HOLD" ]; then
  echo "$(date -u +%FT%TZ) held on purpose ($HOLD); no release until a person lifts the hold"
  if [ "${1:-}" = "--drill" ]; then echo "DRILL NOT RUN: the releases are held on purpose"; exit 1; fi
  exit 0
fi
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
STATE="$HOME_DIR/state"
mkdir -p "$STATE"
exec 9> "$STATE/.lock"
flock -n 9 || {
  echo "$(date -u +%FT%TZ) another look is running; this one leaves it"
  # a drill that did not run is not a pass
  if [ "${1:-}" = "--drill" ]; then echo "DRILL NOT RUN: a release is running; run the drill again when it ends"; exit 1; fi
  exit 0
}
if [ "${1:-}" = "--drill" ]; then exec python3 -I "$HERE/jassist_release.py" --drill; fi
TIP=$(git -C "$ROOT" rev-parse HEAD)
exec python3 -I "$HERE/jassist_release.py" --repo "$ROOT" --tip "$TIP" --state "$STATE" --slug "${RELEASE_REPO_SLUG:-amitjurislpo/jassist}"
