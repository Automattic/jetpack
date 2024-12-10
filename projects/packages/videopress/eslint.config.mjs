import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url, { react: false, textdomain: 'jetpack-videopress-pkg' } ),

	// @todo: Set `react: true` above and remove this dummy block.
	{ name: 'Monorepo react config' },
];
