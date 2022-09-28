if [[ -z "$BUILD_DIR" ]]; then
	echo "::error::BUILD_DIR must be set"
	exit 1
fi

if [[ -z "$PROJECT_PATH" ]]; then
	echo "::error::PROJECT_PATH must be set"
	exit 1
fi

tar --xz -xf "$BUILD_DIR/jetpack-build/build.tar.xz" -C "$BUILD_DIR"

SLUG=$(jq -r -e ".ci.pluginSlug" "$PROJECT_PATH/package.json")
MIRROR=$(jq -r -e ".ci.mirrorName" "$PROJECT_PATH/package.json")

{
	echo "e2e:"
	echo "  volumeMappings:"
	echo "    $BUILD_DIR/build/Automattic/$MIRROR: /var/www/html/wp-content/plugins/$SLUG"
} > ./tools/docker/jetpack-docker-config.yml

if [[ $SLUG != 'jetpack' ]]; then
	echo "    $BUILD_DIR/build/Automattic/jetpack-production: /var/www/html/wp-content/plugins/jetpack" >> ./tools/docker/jetpack-docker-config.yml
fi
