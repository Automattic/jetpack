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
				__( 'Upgrade to a paid plan to use this block on your site.', 'text-domain' )
			)
		).toBe(
			"<span><?php esc_html_e( 'Upgrade to a paid plan to use this block on your site.', 'text-domain' ) ?></span>"
		);
	} );

	test( 'renders _n() to its PHP counterpart as expected', () => {
		expect( renderToStaticMarkup( _n( '%d person', '%d people', 1 + 2, 'text-domain' ) ) ).toBe(
			"<span><?php echo esc_html( _n( '%d person', '%d people', 3, 'text-domain' ) ) ?></span>"
		);
	} );
} );
