import makeBaseConfig, { makeEnvConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	// Legacy jquery-using stuff.
	makeEnvConfig( 'jquery', [ 'custom-colors/**', 'footer-credit/**', 'widgets/music-player/**' ] ),
];
