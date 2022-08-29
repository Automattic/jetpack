this_path=$(
  cd "$(dirname "${BASH_SOURCE[0]}")" || return
  pwd -P
)

pr_ctx=$(cat "$this_path"/resources/gh-context-pr.json)
push_ctx=$(cat "$this_path"/resources/gh-context-push.json)
conf=$(jq --arg dir "bin/tests/resources/logs" '.dirs.logs|=$dir' < "$this_path"/resources/config.json)
config_success=$(echo "$conf" | jq --arg dir "bin/tests/resources/success" '.dirs.output|=$dir')
config_failure=$(echo "$conf" | jq --arg dir "bin/tests/resources/failure" '.dirs.output|=$dir')

NODE_CONFIG=$config_success GITHUB_CONTEXT=$pr_ctx node "$this_path"/../slack.cjs suite "Test suite"
NODE_CONFIG=$config_success GITHUB_CONTEXT=$push_ctx node "$this_path"/../slack.cjs suite "Test suite"
NODE_CONFIG=$config_failure GITHUB_CONTEXT=$pr_ctx node "$this_path"/../slack.cjs suite "Test suite"
NODE_CONFIG=$config_failure GITHUB_CONTEXT=$push_ctx node "$this_path"/../slack.cjs suite "Test suite"
NODE_CONFIG=$config_failure GITHUB_CONTEXT=$push_ctx node "$this_path"/../slack.cjs status "failed"
NODE_CONFIG=$config_failure GITHUB_CONTEXT=$push_ctx node "$this_path"/../slack.cjs status "failed" --report "aa"
NODE_CONFIG=$config_success GITHUB_CONTEXT=$push_ctx node "$this_path"/../slack.cjs status "success" --report "aa"
NODE_CONFIG=$config_success GITHUB_CONTEXT=$push_ctx node "$this_path"/../slack.cjs status "success"
