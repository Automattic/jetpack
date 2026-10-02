import { getScriptData } from '@automattic/jetpack-script-data';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ActivationScreen from '..';

jest.mock( '@automattic/jetpack-script-data' );

const ASSETS_URL =
	'https://example.com/wp-content/plugins/jetpack/jetpack_vendor/automattic/jetpack-licensing/assets/images/';

describe( 'ActivationScreen illustrations', () => {
	const testProps = {
		siteAdminUrl: 'https://example.com/wp-admin/',
		siteRawUrl: 'example.com',
	};

	afterEach( () => {
		getScriptData.mockReset();
	} );

	it( 'builds the illustration URL from script data', () => {
		getScriptData.mockReturnValue( { licensing: { assetsUrl: ASSETS_URL } } );

		render( <ActivationScreen { ...testProps } /> );

		expect( screen.getByRole( 'presentation', { hidden: true } ) ).toHaveAttribute(
			'src',
			`${ ASSETS_URL }jetpack-license-activation-with-lock.png`
		);
	} );

	it( 'renders no illustration when script data has no base URL', () => {
		getScriptData.mockReturnValue( {} );

		render( <ActivationScreen { ...testProps } /> );

		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
		// The support link shares the illustration's container, so it must survive.
		expect( screen.getByRole( 'link', { name: 'Contact us.' } ) ).toBeInTheDocument();
	} );
} );
