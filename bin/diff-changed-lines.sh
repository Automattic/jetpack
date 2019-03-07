#!/bin/bash

# Prints FILE:(LINE_RANGE)+
# Where LINE_RANGE is, e.g., "1-3," (note trailing comma, always a range, even for single line changes: "10-10,")
# Only shows lines from the changed version of FILE. That is, it does not show deleted lines.
# Example Output:
# file.php:3-8,20-32,
# file.js:4-4,22-22,

EXTCMD=(
	'/bin/echo -n "$MERGED:" &&' # Echo "FILE:"
	'diff'                       # Echo "LINE_RANGES"
		'--old-group-format="" --unchanged-group-format=""' # Don't output info for old (deleted) or unchanged (context) lines
		'--new-group-format="%dF-%dL," --changed-group-format="%dF-%dL,"' # Echo LINE_RANGE
		'"$LOCAL" "$REMOTE";' # diff old new
	'echo && :' # Newline after each file, and ignore the rest of the stuff difftool sends
)

EXTCMD="${EXTCMD[@]}"

git difftool --no-prompt --extcmd "$EXTCMD" $@
