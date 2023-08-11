import { renderToStaticMarkup } from 'react-dom/server';
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

	test( 'renders _n() to its PHP counterpart as expected', () => {
		expect(
			renderToStaticMarkup(
				/* Translators: placeholder is a number of people. */
				_n( '%d person', '%d people', 1 + 2, 'jetpack' )
			)
		).toBe(
			// prettier-ignore
			"<span><?php echo esc_html( _n( '%d person', '%d people', 3, 'jetpack' ) ) ?></span>"
		);
	} );

	test( 'renders _x() to its PHP counterpart as expected', () => {
		expect(
			renderToStaticMarkup( _x( 'Read', 'past participle: books I have read', 'jetpack' ) )
		).toBe(
			"<span><?php echo esc_html( _x( 'Read', 'past participle: books I have read', 'jetpack' ) ) ?></span>"
		);
	} );

	test( 'renders _nx() to its PHP counterpart as expected', () => {
		expect(
			renderToStaticMarkup(
				/* Translators: placeholder is a number (group of people). */
				_nx( '%d group', '%d groups', 2 + 3, 'group of people', 'jetpack' )
			)
		).toBe(
			"<span><?php echo esc_html( _nx( '%d group', '%d groups', 5, 'group of people', 'jetpack' ) ) ?></span>"
		);
	} );
} );
