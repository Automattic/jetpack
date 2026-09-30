import { nextElements, readableFor, underlineFor, MANAGED } from '../src/readable-elements';
import { MINIMUM_CONTRAST } from '../src/text-color';
import fixture from './data/readable-elements.json';

// From the shared fixture: what #0073aa and gray #333333 become on each background.
const DARK = '#1e1e1e';
const DARKER = '#002b36';
const LIGHT = '#ffffff';
const ACCENT = '#0073aa';
const ACCENT_ON_DARK = '#008dd1';
const ACCENT_ON_DARKER = '#0098e0';
const GRAY = '#333333';
const GRAY_ON_DARK = '#858585';

describe( 'nextElements', () => {
	it( 'makes an inherited link readable on the new background', () => {
		expect( nextElements( {}, LIGHT, DARK, { link: ACCENT } ) ).toEqual( {
			link: { color: { text: ACCENT_ON_DARK } },
		} );
	} );

	it( "writes the site's own link color out when it already passes", () => {
		expect( nextElements( {}, DARK, LIGHT, { link: ACCENT } ) ).toEqual( {
			link: { color: { text: ACCENT } },
		} );
	} );

	it( 'underlines a link with no hue to keep', () => {
		expect( nextElements( {}, LIGHT, DARK, { link: GRAY } ) ).toEqual( {
			link: {
				color: { text: GRAY_ON_DARK },
				typography: { textDecoration: 'underline' },
			},
		} );
	} );

	it( 're-derives its own color when the background changes again', () => {
		const styles = { elements: { link: { color: { text: ACCENT_ON_DARK } } } };

		expect( nextElements( styles, DARK, DARKER, { link: ACCENT } ) ).toEqual( {
			link: { color: { text: ACCENT_ON_DARKER } },
		} );
	} );

	it( 'never touches a color the creator chose', () => {
		const styles = { elements: { link: { color: { text: '#ff00ff' } } } };

		expect( nextElements( styles, DARK, DARKER, { link: ACCENT } ) ).toBeNull();
	} );

	it( 'takes its color and underline back off when the link passes again', () => {
		const styles = {
			elements: {
				link: {
					color: { text: GRAY_ON_DARK },
					typography: { textDecoration: 'underline' },
				},
			},
		};

		expect( nextElements( styles, DARK, LIGHT, { link: GRAY } ) ).toEqual( {
			link: { color: { text: GRAY } },
		} );
	} );

	it.each( [ 'heading', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ] )( 'covers %s', element => {
		expect( nextElements( {}, LIGHT, DARK, { [ element ]: ACCENT } ) ).toEqual( {
			[ element ]: { color: { text: ACCENT_ON_DARK } },
		} );
	} );

	// Headings are underlined by nothing: only a link is, and only when it has no hue to keep.
	it( 'does not underline a gray heading', () => {
		expect( nextElements( {}, LIGHT, DARK, { heading: GRAY } ) ).toEqual( {
			heading: { color: { text: GRAY_ON_DARK } },
		} );
	} );

	it( 'takes its underline back off when the creator overrides the link color', () => {
		const styles = {
			elements: {
				link: {
					color: { text: '#ff00ff' },
					typography: { textDecoration: 'underline' },
				},
			},
		};

		expect( nextElements( styles, DARK, LIGHT, { link: GRAY } ) ).toEqual( {
			link: { color: { text: '#ff00ff' } },
		} );
	} );

	it( 'leaves an underline the creator set on a link it never underlined', () => {
		const styles = { elements: { link: { typography: { textDecoration: 'underline' } } } };

		expect( nextElements( styles, LIGHT, DARK, { link: ACCENT } ) ).toEqual( {
			link: {
				color: { text: ACCENT_ON_DARK },
				typography: { textDecoration: 'underline' },
			},
		} );
	} );

	it( 'treats a stored null decoration as unset, as it does a null color', () => {
		const styles = {
			elements: {
				link: { color: { text: GRAY_ON_DARK }, typography: { textDecoration: null } },
			},
		};

		expect( nextElements( styles, DARK, DARKER, { link: GRAY } ) ).toEqual( {
			link: {
				color: { text: '#8f8f8f' },
				typography: { textDecoration: 'underline' },
			},
		} );
	} );

	it.each( [ [ 'var(--accent)' ], [ 'rgba(0, 0, 0, 0.5)' ], [ 'red' ], [ undefined ], [ null ] ] )(
		'leaves a link of %p alone',
		link => {
			expect( nextElements( {}, LIGHT, DARK, { link } ) ).toBeNull();
		}
	);

	it( 'changes nothing when the bundle reported no inherited colors', () => {
		expect( nextElements( {}, LIGHT, DARK, {} ) ).toBeNull();
		expect( nextElements( {}, LIGHT, DARK, undefined ) ).toBeNull();
	} );

	it( 'keeps element styles it does not manage', () => {
		const styles = { elements: { button: { color: { background: '#abcdef' } } } };

		expect( nextElements( styles, LIGHT, DARK, { link: ACCENT } ) ).toEqual( {
			button: { color: { background: '#abcdef' } },
			link: { color: { text: ACCENT_ON_DARK } },
		} );
	} );

	it( 'does not modify the styles it was given', () => {
		const styles = { elements: { link: { color: { text: ACCENT_ON_DARK } } } };

		nextElements( styles, DARK, DARKER, { link: ACCENT } );

		expect( styles.elements.link.color.text ).toBe( ACCENT_ON_DARK );
	} );
} );

describe( 'the rules shared with the WordPress.com renderer', () => {
	it( 'manages the same elements', () => {
		expect( fixture.minimumContrast ).toBe( MINIMUM_CONTRAST );
		expect( MANAGED ).toEqual( fixture.elements );
	} );

	it.each( fixture.cases )(
		'makes $element $color readable on $background',
		( { color, background, readable } ) => {
			expect( readableFor( color, background ) ).toBe( readable );
		}
	);

	it.each( fixture.cases )(
		'agrees on underlining $element $color on $background',
		( { element, color, background, underline } ) => {
			expect( 'underline' === underlineFor( element, color, background ) ).toBe( underline );
		}
	);
} );
