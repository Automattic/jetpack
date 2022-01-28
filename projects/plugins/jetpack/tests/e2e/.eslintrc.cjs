const loadIgnorePatterns = require( '../../../../../tools/js-tools/load-eslint-ignore.js' );
const eslintCheckPnpmInstall = require( '../../../../../tools/js-tools/eslint-check-pnpm-install.js' );

module.exports = eslintCheckPnpmInstall(
	__dirname,
	require,
	'jetpack-e2e-commons/.eslintrc.cjs'
) || {
	extends: [ require.resolve( 'jetpack-e2e-commons/.eslintrc.cjs' ) ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
};
