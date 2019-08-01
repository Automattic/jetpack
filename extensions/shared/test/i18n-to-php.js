/**
 * External dependencies
 */
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Internal dependencies
 */
import { __, _n, _x, _nx } from '../i18n-to-php';

describe( 'i18n-to-php', () => {
	test( 'renders __() to its PHP counterpart as expected', () => {
		expect(
			renderToStaticMarkup(
				__( 'Upgrade to a paid plan to use this block on your site.', 'jetpack' )
			)
		).toBe(
			"<span><?php esc_html_e( 'Upgrade to a paid plan to use this block on your site.', 'jetpack' ) ?></span>"
		);
	} );
} );
