import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

/**
 * The `DateRangePicker/` subdirectory is a near-verbatim port of
 * Calypso's `components/date-range-picker/` — forcing full JSDoc on
 * every internal helper would add churn on each upstream re-sync
 * without adding clarity (param names match signatures, behavior
 * matches the Calypso docs). Soften the Jetpack eslint profile for
 * those files only.
 */
export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: [ 'src/js/components/DateRangePicker/**' ],
	rules: {
		'jsdoc/require-description': 'off',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns': 'off',
		'jsdoc/require-returns-description': 'off',
		'@wordpress/no-unused-vars-before-return': 'off',
		// Calypso's picker passes inline arrow callbacks to a bunch of
		// child components (Dropdown renderToggle/renderContent,
		// DateInputs onFrom/onTo handlers). Keeping the verbatim form
		// makes upstream re-syncs mechanical; the callbacks aren't
		// performance-critical at this scale.
		'react/jsx-no-bind': 'off',
	},
} );
