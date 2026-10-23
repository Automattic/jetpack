import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirewallStatus } from '../firewall-status';

const mockUseProduct = jest.fn();

jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => mockUseProduct(),
} ) );

jest.mock( '../../../../hooks/use-my-jetpack-connection', () => {
	const result = { isSiteConnected: true };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../../hooks/use-analytics', () => {
	const result = { recordEvent: () => {} };
	return { __esModule: true, default: () => result };
} );

jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { plugins: {}, themes: {} } ),
} ) );

jest.mock( '../../../../utils/protect-page', () => ( {
	getProtectPageUrl: () => 'admin.php?page=jetpack-protect&p=%2F%3Ftab%3Dsettings',
} ) );

const wafConfig = ( overrides: Partial< ProtectData[ 'wafConfig' ] > ) =>
	( {
		wafConfig: {
			waf_supported: true,
			waf_enabled: true,
			jetpack_waf_automatic_rules: '',
			blocked_logins: 0,
			brute_force_protection: true,
			...overrides,
		},
	} ) as ProtectData;

describe( 'FirewallStatus', () => {
	it.each( [
		[ 'On', 'a free site with the firewall on', false, { waf_enabled: true }, 'Upgrade' ],
		[
			'On',
			'a paid site without automatic rules',
			true,
			{ waf_enabled: true },
			'firewall settings',
		],
		[ 'Off', 'a site with the firewall off', false, { waf_enabled: false }, 'firewall settings' ],
		[
			'Inactive',
			'a host with its own firewall',
			false,
			{ waf_supported: false },
			'hosting provider',
		],
	] )( 'shows %s for %s', async ( status, _, hasPaidPlanForProduct, overrides, explanation ) => {
		mockUseProduct.mockReturnValue( { detail: { isPluginActive: true, hasPaidPlanForProduct } } );
		render( <FirewallStatus data={ wafConfig( overrides ) } /> );

		expect( screen.getByText( status ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'More about Firewall' } ) );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toHaveTextContent( explanation );
	} );

	it( 'shows On with nothing to explain while automatic rules run', () => {
		mockUseProduct.mockReturnValue( {
			detail: { isPluginActive: true, hasPaidPlanForProduct: true },
		} );
		render( <FirewallStatus data={ wafConfig( { jetpack_waf_automatic_rules: '1' } ) } /> );

		expect( screen.getByText( 'On' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'More about Firewall' } )
		).not.toBeInTheDocument();
	} );
} );
