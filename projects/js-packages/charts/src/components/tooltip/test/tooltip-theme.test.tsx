import { render, screen } from '@testing-library/react';
import { resolveCssVariable } from '../../../utils/resolve-css-var';
import { TooltipTheme } from '../private/tooltip-theme';

jest.mock( '@wordpress/theme', () => ( { ...jest.requireActual( '@wordpress/theme' ) } ) );
jest.mock( '../../../utils/resolve-css-var', () => ( { resolveCssVariable: jest.fn() } ) );

const theme = jest.requireMock( '@wordpress/theme' );
const { ThemeProvider } = jest.requireActual( '@wordpress/theme' );

const spyOnThemeProvider = () =>
	jest.spyOn( theme, 'ThemeProvider' ).mockImplementation( ( { children } ) => children );

describe( 'TooltipTheme', () => {
	afterEach( () => {
		jest.restoreAllMocks();
		theme.ThemeProvider = ThemeProvider;
	} );

	test( 'renders the box unthemed when core exports no public ThemeProvider', () => {
		theme.ThemeProvider = undefined;
		jest.mocked( resolveCssVariable ).mockReturnValue( '#1e1e1e' );

		render( <TooltipTheme>box</TooltipTheme> );

		expect( screen.getByText( 'box' ) ).toBeInTheDocument();
	} );

	test.each( [ 'rgba(0, 0, 0, 0.85)', 'not-a-color', null ] )(
		'seeds the default surface when the surface role resolves to %p',
		value => {
			const provider = spyOnThemeProvider();
			jest.mocked( resolveCssVariable ).mockReturnValue( value );

			render( <TooltipTheme>box</TooltipTheme> );

			expect( provider.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				color: { background: '#1e1e1e' },
			} );
		}
	);

	test( 'seeds an opaque surface role as hex', () => {
		const provider = spyOnThemeProvider();
		jest.mocked( resolveCssVariable ).mockReturnValue( 'rgb(255, 255, 255)' );

		render( <TooltipTheme>box</TooltipTheme> );

		expect( provider.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			color: { background: '#ffffff' },
		} );
	} );

	test( 'renders with the real ThemeProvider when the surface role is translucent', () => {
		jest.mocked( resolveCssVariable ).mockReturnValue( 'rgba(0, 0, 0, 0.85)' );

		render( <TooltipTheme>box</TooltipTheme> );

		expect( screen.getByText( 'box' ) ).toBeInTheDocument();
	} );
} );
