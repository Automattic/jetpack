## Ignoring changes in non-testable files & folders:
# *.md
# *.txt
# *.yml
# docs/ folder
# docker/ folder
# .*ignore

IGNORE_FORMAT_REGEX='(\.md$|\.txt$|\.yml$|\..*ignore$)|(^(docs|docker))\/'

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
	TRAVIS_COMMIT_RANGE="FETCH_HEAD...$TRAVIS_BRANCH"
fi
git diff --name-only $TRAVIS_COMMIT_RANGE | grep -qvE $IGNORE_FORMAT_REGEX || {
	echo "Only non-testable files were updated, bailing from running unit tests."
	exit 1
}
exit
