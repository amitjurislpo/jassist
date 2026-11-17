#!/bin/sh
# Sets each data link Lambda's secrets from Doppler (project "${DOPPLER_PROJECT:-juris_assist}"): prd -> production,
# stg -> preview. Nothing is printed or logged. The AWS CLI cannot read its input from a pipe,
# so the request is written to a private temporary file (owner-only, mode 600) for the one call
# and deleted straight after. Needs AWS credentials allowed to update the two Lambdas.
#   DATALINK_DATABASE_URL  that environment's database login (only the Lambda holds it)
#   DATA_LINK_SECRET       the signing secret (the site holds the same value, see sync-secrets.sh)
set -eu
PROJECT=${DOPPLER_PROJECT:-juris_assist}
REGION=${AWS_REGION:-us-east-1}
umask 077
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM
for pair in prd:production:jassist-datalink-prod stg:preview:jassist-datalink-preview; do
  cfg=$(echo "$pair" | cut -d: -f1); envname=$(echo "$pair" | cut -d: -f2); fn=$(echo "$pair" | cut -d: -f3)
  doppler secrets download --project "$PROJECT" --config "$cfg" --no-file --format json \
    | jq -c --arg fn "$fn" --arg env "$envname" --arg project "$PROJECT" '
        if (.DATALINK_DATABASE_URL // "") == "" or ((.DATA_LINK_SECRET // "") | length) < 32
        then error($project + "/" + $env + ": DATALINK_DATABASE_URL or DATA_LINK_SECRET (32+ characters) is missing")
        else {FunctionName: $fn, Environment: {Variables: {
          JASSIST_ENVIRONMENT: $env, DATABASE_URL: .DATALINK_DATABASE_URL, DATA_LINK_SECRET: .DATA_LINK_SECRET}}}
        end' > "$TMP/request.json"
  aws lambda update-function-configuration --region "$REGION" --cli-input-json "file://$TMP/request.json" \
    --query '{fn: FunctionName, state: LastUpdateStatus}' --output text
  rm -f "$TMP/request.json"
  aws lambda wait function-updated --region "$REGION" --function-name "$fn"
  echo "configured $fn ($envname)"
done
