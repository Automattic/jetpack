#!/usr/bin/env bash

# Print help and exit.
function usage {
	cat <<-EOH
		usage: $0 [-p <slug>] [-w]

		rsync changes to plugins

		Pass \`-p <plugin_slug>\` to target a specific plugin in projects/plugins/ (defaults to jetpack).
		Pass \`-w\` to "watch" and auto-push changes when made (requires fswatch). Works best if using keypair auth.
	EOH
	exit 1
}

PLUGIN=
WATCH=
JETPACK_REPO_PATH=
DEST_PLUGINS_PATH=
while getopts ":p:s:d:hw" opt; do
	case ${opt} in
		p)
			PLUGIN=$OPTARG
			;;
		w)
			WATCH=true
			;;
		s)
			JETPACK_REPO_PATH=$OPTARG
			;;
		d)
			DEST_PLUGINS_PATH=$OPTARG
			;;
		h)
			usage
			;;
		*)
			echo "Command not supported."
			usage;
			exit 1
			;;
	esac
done
shift "$(($OPTIND - 1))"

echo $DEST_PLUGINS_PATH"!!!"
echo $PLUGIN"!!!"

# Point to your local Jetpack checkout
#JETPACK_REPO_PATH=""
# Point to the source /plugins directory
#DEST_PLUGINS_PATH=""

CURRENT_DIR=$(pwd)
echo $CURRENT_DIR
if [[ -z $JETPACK_REPO_PATH ]]; then
	if [[ -d "$CURRENT_DIR/projects/plugins" ]]; then
	 JETPACK_REPO_PATH="$CURRENT_DIR/projects/plugins"
	fi

	if [[ -z $JETPACK_REPO_PATH ]]; then
		read -p "Add the /absolute/path/to/local/jetpack/repo/root to sync from: " JETPACK_REPO_PATH && [[ -n $JETPACK_REPO_PATH ]] || exit 1
	fi
fi

if [[ -z $DEST_PLUGINS_PATH ]]; then
	read -p "Add the full path to the destination /plugins dir, like user@some.host.com:/some/path/to/wp-content/plugins: " DEST_PLUGINS_PATH && [[ -n $DEST_PLUGINS_PATH ]] || exit 1
fi

if [[ -z $PLUGIN ]]; then
	read -p "Which plugin are you syncing? (press enter for jetpack): " PLUGIN && [[ -n $PLUGIN ]] || PLUGIN="jetpack"
fi

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
SOURCE="$JETPACK_REPO_PATH/$PLUGIN"
FILTER_FILES="$SCRIPT_DIR/filter-files.txt"

function rsyncpush() {
	rsync -azLKv --delete --delete-after \
		--filter="merge $FILTER_FILES" \
		--rsync-path="mkdir -p $DEST_PLUGINS_PATH/$PLUGIN && rsync" \
		"$SOURCE" \
		"$DEST_PLUGINS_PATH"
}

function rsyncwatch() {
	fswatch -or --filter-from="$FILTER_FILES" "$SOURCE" | \
	while read -r changes; do
		echo "$changes Changes detected. Pushing..."
		rsyncpush;
		echo "Done!"
		echo "Watching..."
	done
}

if [[ -n $WATCH ]]; then
	echo "Watching $PLUGIN for things to auto-push..."
	rsyncwatch
else
	rsyncpush
fi
