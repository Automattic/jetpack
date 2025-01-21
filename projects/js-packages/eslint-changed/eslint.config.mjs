import makeBaseConfig from '@automattic/jetpack-js-tools/eslintrc/base.mjs';

export default [ ...makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ) ];
