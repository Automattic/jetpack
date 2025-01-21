import makeBaseConfig, { makeEnvConfig } from '@automattic/jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	makeEnvConfig( 'node', [ 'tests/**', 'tools/**' ] ),
];
