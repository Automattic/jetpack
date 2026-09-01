import { makeBaseConfig, makeEnvConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url ),
	makeEnvConfig( 'node', [ 'tests/**', 'tools/**' ] )
);
