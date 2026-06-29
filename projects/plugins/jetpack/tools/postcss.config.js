module.exports = () => ( {
	plugins: [
		require( '@csstools/postcss-global-data' )( {
			// Provide the properties that postcss-custom-properties is going to work with.
			files: [
				require.resolve( '@automattic/calypso-color-schemes/root-only/index.css' ),
				// Feed the WPDS design tokens to postcss-custom-properties so the legacy
				// `_inc/` dashboard's `var(--wpds-*, #fallback)` usages inline to the actual
				// token value (e.g. #707070) instead of the hand-written hex fallback. These
				// tokens normally arrive transitively via `@wordpress/ui`'s CSS bundle, which
				// this dashboard doesn't import. Modernized (admin-ui) pages get them at
				// runtime instead; see the shared token stylesheet enqueued there.
				// The `design-tokens.css` subpath is exposed via @wordpress/theme's exports map.
				require.resolve( '@wordpress/theme/design-tokens.css' ),
			],
		} ),
		require( 'postcss-custom-properties' )( {
			// Use of `preserve: false` dates back to when we still used @automattic/calypso-build.
			// Ideally we'd get rid of it to properly make use of CSS vars, but first we have to
			// figure out how to ensure the vars actually get defined in the browser without
			// including them in every bundle. Some base stylesheet (wp_register_style) the other
			// stylesheets depend on maybe? And also deal with extremely generic vars like "--color-text".
			//
			// See also https://github.com/Automattic/jetpack/pull/13854#issuecomment-550898168,
			// where people were confused about what was going on when calypso-build stopped
			// including a postcss.config.js like this by default.
			preserve: false,
		} ),
		require( 'autoprefixer' ),
	],
} );
