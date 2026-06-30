/**
 * @type {import('stylelint').Config}
 */
const config = {
	extends: 'jetpack-js-tools/stylelint.config.base.mjs',
	overrides: [
		{
			// Transitional: the Forms dashboard references the @wordpress/theme 0.16
			// color token names (--wpds-color-background-*/--wpds-color-foreground-*)
			// with a fallback to the current 0.15 names, so theming keeps working both
			// before and after the bundled @wordpress/* monorepo bump. The DS-token
			// linter only knows one token vocabulary at a time (it reads the installed
			// @wordpress/theme via @wordpress/stylelint-config), so it can't validate a
			// line that intentionally references both. Disable it for these files until
			// the bump (theme 0.16 + @wordpress/stylelint-config 23.41) lands on trunk;
			// then this override and the old-name fallbacks can be removed.
			files: [ 'projects/packages/forms/src/dashboard/**/*.scss' ],
			rules: {
				'plugin-wpds/no-unknown-ds-tokens': null,
			},
		},
	],
};

export default config;
