import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [ ...makeBaseConfig( import.meta.url, { textdomain: 'boost-score-api' } ) ];
