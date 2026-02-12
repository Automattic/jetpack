import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';

const styleTextStderr = ( format, text, options ) =>
	styleText( format, text, { stream: process.stderr, ...options } );

// This is a ridiculous hack around https://github.com/WordPress/gutenberg/issues/75047.
// `@wordpress/stylelint-config` tries to `require.resolve` various modules, which fails for `stylelint-config-recommended` and `stylelint-config-recommended-scss`
// as those have gone esm-only. This hack replaces those two module names with absolute paths to our copies so `require.resolve` doesn't have to actually resolve them.
registerHooks( {
	load( url, context, nextLoad ) {
		const ret = nextLoad( url, context );

		if ( /\/node_modules\/@wordpress\/stylelint-config\//.test( url ) ) {
			if ( ret.format === 'commonjs' ) {
				ret.source = ret.source
					.toString()
					.replace(
						/'(stylelint-config-recommended|stylelint-config-recommended-scss)'/,
						( _, m ) => JSON.stringify( fileURLToPath( import.meta.resolve( m ) ) )
					);
			} else {
				console.error(
					styleTextStderr(
						'red',
						styleTextStderr( 'bold', `Is the hack in ${ import.meta.filename } obsolete?` ) +
							` Loaded ${ fileURLToPath( url ) } as ${ ret.format } rather than commonjs.`
					)
				);
			}
		}

		return ret;
	},
} );

/**
 * @type {import('stylelint').Config}
 */
const baseConfig = {
	extends: fileURLToPath( import.meta.resolve( '@wordpress/stylelint-config/scss-stylistic' ) ),
	rules: {
		// In addition to what `@wordpress/stylelint-config/scss-stylistic` does by default, also ignore comments containing /stylelint-disable/.
		'@stylistic/max-line-length': [
			80,
			{
				ignore: 'non-comments',
				ignorePattern: [
					'/(https?://[0-9,a-z]*.*)|(^description\\:.+)|(^tags\\:.+)/i',
					'/stylelint-disable/',
				],
			},
		],

		'font-family-no-missing-generic-family-keyword': [
			true,
			{
				ignoreFontFamilies: [
					'dashicons', // https://github.com/WordPress/dashicons
					'FontAwesome', // https://fontawesome.com/icons, used by CRM
					'Genericons', // https://github.com/Automattic/genericons
					'Noticons', // WordPress.com internal font
					'social-logos', // see js-packages/social-logos
				],
			},
		],

		// Stylelint allows `0px` in math-type functions, but sometimes those math-type functions are
		// passed vars instead of hard-coded values, and we need to prevent those from being unitless.
		'length-zero-no-unit': [
			true,
			{
				ignore: [ 'custom-properties' ],
			},
		],

		// In theory this is a good rule, but in practice it's a massive lift to resolve existing violations.
		// Here's an example that has no good answers:
		// https://github.com/Automattic/jetpack/blob/86e27497d4b8e0736cae61c325f017dedad16dbb/projects/js-packages/components/components/button/style.module.scss#L73-L94
		//
		// Even Stylelint suggests disabling this rule if nesting is used:
		// https://github.com/stylelint/stylelint/issues/7844#issuecomment-2230857428
		'no-descending-specificity': null,

		'property-no-unknown': [
			true,
			{
				ignoreSelectors: [ ':export' ], // Ignore selector used by CSS Modules.
				ignoreProperties: [ 'shadow-color' ], // Ignore property used by React Native.
			},
		],

		// Disabled until a valid pattern has been decided on: https://github.com/WordPress/gutenberg/issues/28616
		'selector-class-pattern': null,

		// Disabled due to widespread inconsistent patterns throughout that would require coordinated changes across CSS, JS, and PHP across multiple repos.
		'selector-id-pattern': null,

		'selector-pseudo-class-no-unknown': [
			true,
			{
				ignorePseudoClasses: [ 'export', 'global' ], // Ignore pseudo-classes used by CSS Modules.
			},
		],

		'value-keyword-case': [
			'lower',
			{
				ignoreProperties: [ /^(--|\$)/ ], // Ignore CSS and SCSS vars.
				camelCaseSvgKeywords: true, // This is the overwhelming convention in our codebase and in core.
			},
		],
	},
};

export default baseConfig;
