#!/bin/bash
##
# Prepare input for AI changelog generation.
#
# Generates the diff, checks its size, collects project metadata, and builds
# a complete prompt file for actions/ai-inference. The prompt is generated as
# JSON (which is valid YAML) using jq, so all string content is properly
# escaped regardless of special characters in the PR description, title, or diff.
#
# Required env vars: BASE, HEAD, PROJECTS, PLUGIN_DEPS, PR_DESCRIPTION, PR_TITLE, PR_NUMBER
# Outputs: too_large, prompt_file
##

set -euo pipefail

# Generate diff and check size. Write to a temp file rather than a variable
# to avoid NUL-byte truncation and to count bytes (not characters).
DIFF_FILE=$(mktemp)
git diff "$BASE...$HEAD" > "$DIFF_FILE"
DIFF_SIZE=$(wc -c < "$DIFF_FILE")
echo "Diff size: $DIFF_SIZE bytes"

if [ "$DIFF_SIZE" -gt 50000 ]; then
	echo "too_large=true" >> "$GITHUB_OUTPUT"
	echo "Diff exceeds 50K byte threshold."
	exit 0
fi

echo "too_large=false" >> "$GITHUB_OUTPUT"

# Read each project's available changelog types from composer.json.
TYPES=""
while IFS= read -r proj; do
	[ -z "$proj" ] && continue
	COMPOSER="projects/$proj/composer.json"
	if [ -f "$COMPOSER" ]; then
		PROJ_TYPES=$(php -r "
			\$d = json_decode(file_get_contents('$COMPOSER'), true);
			\$types = \$d['extra']['changelogger']['types'] ?? null;
			if (\$types) echo implode(', ', array_keys(\$types));
		" 2>/dev/null || true)
		if [ -n "$PROJ_TYPES" ]; then
			TYPES="${TYPES}${proj}: ${PROJ_TYPES}"$'\n'
		fi
	fi
done <<< "$PROJECTS"

SYSTEM_PROMPT='You generate changelog entries for a Jetpack monorepo PR. You will be given
a git diff, a list of projects needing changelog entries, and PR metadata.

Rules for changelog entries:
- Start with a capital letter and end with a period.
- Use imperative mood (e.g., "Add feature." not "Added feature.").
- Use a "Component: description." prefix when the change is specific to a
  component within the project.
- Do NOT use the package/project name itself as prefix for entries in that
  package.
- Describe the change from a user'\''s perspective.

For significance:
- "patch" for bug fixes and minor changes.
- "minor" for new features and enhancements.
- "major" for breaking changes.

For type, most projects use: security, added, changed, deprecated, removed, fixed.
BUT plugins/jetpack uses custom types: major, enhancement, compat, bugfix, other.
The available types for each project are listed in the input — always use
these instead of guessing.

For trivial or internal changes with no user-facing impact, set the entry to
an empty string and provide a comment explaining why.

If a plugin is listed as a dependent of a project you are adding a changelog
entry for, also add a changelog entry for that plugin describing the
downstream impact. Only add a plugin changelog entry if the change is
relevant to end users or site administrators.'

USER_MESSAGE="PR title: ${PR_TITLE}
PR number: ${PR_NUMBER}

PR description:
${PR_DESCRIPTION:-}

Projects needing changelog entries (project paths):
${PROJECTS}

Available changelog types for each project:
${TYPES}

Pre-computed plugin dependents for each project (may be empty):
${PLUGIN_DEPS:-}

Git diff:
$(cat "$DIFF_FILE")"

JSON_SCHEMA='{
  "name": "changelog_entries",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "entries": {
        "type": "array",
        "description": "Array of changelog entries to create",
        "items": {
          "type": "object",
          "properties": {
            "project": {
              "type": "string",
              "description": "Project path, e.g. plugins/jetpack or packages/changelogger"
            },
            "significance": {
              "type": "string",
              "enum": ["patch", "minor", "major"],
              "description": "Significance of the change"
            },
            "type": {
              "type": "string",
              "description": "Entry type (project-specific, e.g. fixed, added, bugfix, enhancement)"
            },
            "entry": {
              "type": "string",
              "description": "The changelog entry text. Empty string for trivial/internal changes."
            },
            "comment": {
              "type": "string",
              "description": "Optional comment for trivial/internal entries with empty entry text. Empty string if not needed."
            }
          },
          "additionalProperties": false,
          "required": ["project", "significance", "type", "entry", "comment"]
        }
      }
    },
    "additionalProperties": false,
    "required": ["entries"]
  }
}'

# Build the prompt file as JSON (valid YAML). jq handles all string escaping,
# so special characters in the PR description, title, or diff are safe.
# The .prompt.yml suffix is required — actions/ai-inference only parses files
# ending in .prompt.yml or .prompt.yaml as structured YAML prompt configs.
PROMPT_FILE=$(mktemp --suffix=.prompt.yml)
jq -n \
	--arg system_prompt "$SYSTEM_PROMPT" \
	--arg user_message "$USER_MESSAGE" \
	--argjson json_schema "$JSON_SCHEMA" \
	'{
		messages: [
			{role: "system", content: $system_prompt},
			{role: "user", content: $user_message}
		],
		model: "openai/gpt-4o",
		modelParameters: {temperature: 0.3},
		responseFormat: "json_schema",
		jsonSchema: ($json_schema | tostring)
	}' > "$PROMPT_FILE"

echo "prompt_file=$PROMPT_FILE" >> "$GITHUB_OUTPUT"
