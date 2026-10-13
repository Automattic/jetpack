import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

// ESM test: static jest.mock does not work under --experimental-vm-modules, so mock the module
// with unstable_mockModule (must run before the dynamic imports of the components below).
const mockGetScriptData = jest.fn< () => object >();

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	...( jest.requireActual( '@automattic/jetpack-script-data' ) as object ),
	getScriptData: mockGetScriptData,
} ) );

const { default: StepDisconnectConfirm } = await import( '../steps/step-disconnect-confirm' );
const { default: StepThankYou } = await import( '../steps/step-thank-you' );

const ASSETS_URL =
	'https://example.com/wp-content/plugins/jetpack/jetpack_vendor/automattic/jetpack-connection/assets/images/';

describe( 'disconnect dialog illustrations', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'StepDisconnectConfirm', () => {
		it( 'builds the illustration URL from script data', () => {
			mockGetScriptData.mockReturnValue( { connection: { assetsUrl: ASSETS_URL } } );

			render( <StepDisconnectConfirm onExit={ jest.fn() } onProvideFeedback={ jest.fn() } /> );

			expect( screen.getByTestId( 'decorative-card_image' ) ).toHaveStyle( {
				backgroundImage: `url(${ ASSETS_URL }disconnect-confirm.jpg)`,
			} );
		} );

		it( 'renders no illustration when script data has no base URL', () => {
			mockGetScriptData.mockReturnValue( {} );

			render( <StepDisconnectConfirm onExit={ jest.fn() } onProvideFeedback={ jest.fn() } /> );

			expect( screen.getByTestId( 'decorative-card_image' ) ).not.toHaveAttribute( 'style' );
		} );
	} );

	describe( 'StepThankYou', () => {
		it( 'builds the illustration URL from script data', () => {
			mockGetScriptData.mockReturnValue( { connection: { assetsUrl: ASSETS_URL } } );

			render( <StepThankYou onExit={ jest.fn() } /> );

			expect( screen.getByTestId( 'decorative-card_image' ) ).toHaveStyle( {
				backgroundImage: `url(${ ASSETS_URL }disconnect-thanks.jpg)`,
			} );
		} );

		it( 'renders no illustration when script data has no base URL', () => {
			mockGetScriptData.mockReturnValue( {} );

			render( <StepThankYou onExit={ jest.fn() } /> );

			expect( screen.getByTestId( 'decorative-card_image' ) ).not.toHaveAttribute( 'style' );
		} );
	} );
} );
