import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

// @todo: Remove this file, use the defaults (particularly `react: true`).
export default [ ...makeBaseConfig( import.meta.url, { react: false } ) ];
