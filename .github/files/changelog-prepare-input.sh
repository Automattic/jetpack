#!/bin/bash
##
# Prepare input for AI changelog generation.
#
# Generates the diff, checks its size, collects project metadata, and builds
# a complete prompt YAML file for actions/ai-inference. The prompt is generated
# dynamically (rather than using template variables in a static YAML file)
# because multi-line content like the PR description and diff would break
# YAML block scalar parsing if substituted via {{variables}}.
#
# Required env vars: BASE, HEAD, PROJECTS, PLUGIN_DEPS, PR_DESCRIPTION, PR_TITLE, PR_NUMBER
# Outputs: too_large, prompt_file
##

set -euo pipefail

# Generate diff and check size.
DIFF=$(git diff "$BASE...$HEAD")
DIFF_SIZE=${#DIFF}
echo "Diff size: $DIFF_SIZE characters"

if [ "$DIFF_SIZE" -gt 50000 ]; then
	echo "too_large=true" >> "$GITHUB_OUTPUT"
	echo "Diff exceeds 50K character threshold."
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

# Indent every line of stdin by 6 spaces (for YAML block scalar content).
indent() { sed 's/^/      /'; }

# Build the complete prompt YAML with all content properly indented.
PROMPT_FILE=$(mktemp)
cat > "$PROMPT_FILE" <<'SYSTEM_START'
messages:
  - role: system
    content: |-
      You generate changelog entries for a Jetpack monorepo PR. You will be given
      a git diff, a list of projects needing changelog entries, and PR metadata.

      Rules for changelog entries:
      - Start with a capital letter and end with a period.
      - Use imperative mood (e.g., "Add feature." not "Added feature.").
      - Use a "Component: description." prefix when the change is specific to a
        component within the project.
      - Do NOT use the package/project name itself as prefix for entries in that
        package.
      - Describe the change from a user's perspective.

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
      relevant to end users or site administrators.

  - role: user
    content: |-
SYSTEM_START

# Append user message content, indented for the block scalar.
{
	echo "PR title: ${PR_TITLE}"
	echo "PR number: ${PR_NUMBER}"
	echo ""
	echo "PR description:"
	echo "${PR_DESCRIPTION:-}"
	echo ""
	echo "Projects needing changelog entries (project paths):"
	echo "$PROJECTS"
	echo ""
	echo "Available changelog types for each project:"
	echo "$TYPES"
	echo ""
	echo "Pre-computed plugin dependents for each project (may be empty):"
	echo "${PLUGIN_DEPS:-}"
	echo ""
	echo "Git diff:"
	echo "$DIFF"
} | indent >> "$PROMPT_FILE"

cat >> "$PROMPT_FILE" <<'FOOTER'

model: openai/gpt-4o

modelParameters:
  temperature: 0.3

responseFormat: json_schema
jsonSchema: |-
  {
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
  }
FOOTER

echo "prompt_file=$PROMPT_FILE" >> "$GITHUB_OUTPUT"
