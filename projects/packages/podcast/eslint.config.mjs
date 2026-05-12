import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * The `date-range-picker/` subdirectory is a near-verbatim port of
 * Calypso's `components/date-range-picker/` (via the activity-log
 * package's copy). Forcing full JSDoc on every internal helper would
 * add churn on each upstream re-sync without adding clarity, and the
 * inline arrow callbacks are needed to keep the Calypso shape so
 * re-syncs stay mechanical. Soften the Jetpack eslint profile for
 * those files only.
 */
export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'src/dashboard/stats/components/date-range-picker/**' ],
	rules: {
		'jsdoc/require-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-returns-description': 'off',
		'@wordpress/no-unused-vars-before-return': 'off',
		'react/jsx-no-bind': 'off',
	},
} );
