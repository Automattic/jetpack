import { makeBaseConfig, makeEnvConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url ),
	// Legacy jquery-using stuff.
	makeEnvConfig( 'jquery', [ 'custom-colors/**', 'footer-credit/**', 'widgets/music-player/**' ] )
);
