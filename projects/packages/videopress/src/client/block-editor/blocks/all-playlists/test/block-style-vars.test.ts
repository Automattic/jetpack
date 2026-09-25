import { blockStyleVars } from '../block-style-vars';

describe( 'blockStyleVars', () => {
	it( 'returns nothing for a block without style settings', () => {
		expect( blockStyleVars( {} ) ).toEqual( { classes: [], style: {} } );
	} );

	it( 'maps presets to their global-styles variables and custom values as they are', () => {
		const vars = blockStyleVars( {
			fontFamily: 'Heading',
			fontSize: 'large',
			textColor: 'primary',
			style: {
				typography: {
					fontStyle: 'italic',
					fontWeight: '700',
					lineHeight: 1.4,
					letterSpacing: '0.05em',
					textTransform: 'uppercase',
					textDecoration: 'underline',
				},
			},
		} );

		expect( vars.classes ).toEqual( [
			'has-vpap-font-family',
			'has-vpap-font-size',
			'has-vpap-font-style',
			'has-vpap-font-weight',
			'has-vpap-line-height',
			'has-vpap-letter-spacing',
			'has-vpap-text-transform',
			'has-vpap-text-decoration',
			'has-vpap-color',
		] );
		expect( vars.style ).toEqual( {
			'--vpap-font-family': 'var(--wp--preset--font-family--heading)',
			'--vpap-font-size': 'var(--wp--preset--font-size--large)',
			'--vpap-font-style': 'italic',
			'--vpap-font-weight': '700',
			'--vpap-line-height': '1.4',
			'--vpap-letter-spacing': '0.05em',
			'--vpap-text-transform': 'uppercase',
			'--vpap-text-decoration': 'underline',
			'--vpap-color': 'var(--wp--preset--color--primary)',
		} );
	} );

	it( 'prefers presets over custom values and expands the var:preset notation', () => {
		const vars = blockStyleVars( {
			fontSize: 'small',
			style: {
				typography: { fontSize: '13px', fontFamily: 'var:preset|font-family|body' },
				color: { text: '#123456' },
			},
		} );

		expect( vars.style ).toEqual( {
			'--vpap-font-family': 'var(--wp--preset--font-family--body)',
			'--vpap-font-size': 'var(--wp--preset--font-size--small)',
			'--vpap-color': '#123456',
		} );
	} );

	it( 'drops values that could break out of the style attribute', () => {
		const vars = blockStyleVars( {
			fontSize: '1rem; background: red',
			style: {
				typography: {
					fontFamily: 'url(https://evil.example/x)',
					fontWeight: '700; color: red',
					lineHeight: '',
				},
				color: { text: 'red}body{display:none' },
			},
		} );

		expect( vars ).toEqual( { classes: [], style: {} } );
	} );
} );
