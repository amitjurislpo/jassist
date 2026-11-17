#!/bin/sh
# Copies the secret variables from Doppler (project "${DOPPLER_PROJECT:-juris_assist}") into Vercel.
# Doppler config prd -> Vercel Production, stg -> Vercel Preview. Values are piped straight
# from one tool to the other; nothing is printed or written to disk. Missing keys are skipped.
# The database login is NOT copied: it lives only in the data link Lambdas (scripts/datalink-config.sh).
# Nor are IAMJCG_CONSUMER_CREDENTIAL and RESEND_API_KEY: the release worker puts them in the data link, and the
# site reads them from there (lib/config/linked.ts), so no Vercel token is ever needed for them.
set -eu
PROJECT=${DOPPLER_PROJECT:-juris_assist}
KEYS="DATA_LINK_URL DATA_LINK_SECRET NEXT_PUBLIC_SANITY_PROJECT_ID SANITY_API_READ_TOKEN SANITY_API_WRITE_TOKEN SANITY_WEBHOOK_SECRET"
for pair in prd:production stg:preview; do
  cfg=${pair%%:*}; target=${pair#*:}
  for k in $KEYS; do
    if doppler secrets get "$k" --project "$PROJECT" --config "$cfg" --plain >/dev/null 2>&1 \
       && [ -n "$(doppler secrets get "$k" --project "$PROJECT" --config "$cfg" --plain 2>/dev/null)" ]; then
      flag="--sensitive"; case "$k" in NEXT_PUBLIC_*) flag="";; esac
      doppler secrets get "$k" --project "$PROJECT" --config "$cfg" --plain | tr -d '\n' | vercel env add "$k" "$target" $flag --force >/dev/null 2>&1 \
        && echo "synced $k -> $target" || echo "FAILED $k -> $target"
    else
      echo "missing $k in $PROJECT/$cfg (skipped)"
    fi
  done
done
