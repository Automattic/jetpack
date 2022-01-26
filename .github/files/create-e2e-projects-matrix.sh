PROJECTS=('{"project":"Jetpack","path":"projects/plugins/jetpack/tests/e2e"}' '{"project":"Boost","path":"projects/plugins/boost/tests/e2e"}')
PROJECTS_MATRIX=()

CHANGED_PROJECTS="$(.github/files/list-changed-projects.php --debug)"
#echo "$CHANGED_PROJECTS"

for PROJECT in "${PROJECTS[@]}"; do
	PROJECT_NAME=$(jq -r ".project" <<<"$PROJECT")
	PROJECT_PATH=$(jq -r ".path" <<<"$PROJECT")
	TARGET_PROJECTS=$(jq -r -e ".ci.targets[]" "$PROJECT_PATH/package.json")

	if [ "$TARGET_PROJECTS" == "" ]; then
		# if no target projects are found run the tests
		PROJECTS_MATRIX+=("$PROJECT")
	else
		# iterate over defined target plugins/projects and see if they are changed
		for TESTED_PROJECT in $TARGET_PROJECTS; do
			RESULT=$(jq --arg prj "$TESTED_PROJECT" '.[$prj]' <<<"$CHANGED_PROJECTS")
			#	printf "%s: %s" "$TESTED_PROJECT" "$RESULT"
			if [[ "$RESULT" == true ]]; then
				PROJECTS_MATRIX+=("$PROJECT")
				#	printf " ==> %s tests should run\n" "$PROJECT_NAME"
				break
			fi
		done
	fi
done

jq -s -c -r '.' <<<"${PROJECTS_MATRIX[@]}"
