import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirewallStatus } from '../firewall-status';

const mockUseProduct = jest.fn();
const mockConnection = { isSiteConnected: true };

jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => mockUseProduct(),
} ) );

jest.mock( '../../../../hooks/use-my-jetpack-connection', () => ( {
	__esModule: true,
	default: () => mockConnection,
} ) );

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
	beforeEach( () => {
		mockConnection.isSiteConnected = true;
	} );

	it.each( [
		[ 'On', 'a free site with the firewall on', false, { waf_enabled: true }, 'Upgrade' ],
		[ 'On', 'a paid site without automatic rules', true, {}, 'Turn them on' ],
		[ 'Off', 'a site with the firewall off', false, { waf_enabled: false }, 'Turn it on' ],
		[
			'Inactive',
			'a host with its own firewall',
			false,
			{ waf_supported: false, waf_enabled: false },
			'hosting provider',
		],
	] )( 'shows %s for %s', async ( status, _, hasPaidPlanForProduct, overrides, explanation ) => {
		mockUseProduct.mockReturnValue( { detail: { isPluginActive: true, hasPaidPlanForProduct } } );
		render( <FirewallStatus data={ wafConfig( overrides ) } /> );

		expect( screen.getByText( status ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'More about Firewall' } ) );
		const dialog = await screen.findByRole( 'dialog' );
		expect( dialog ).toHaveTextContent( `Firewall: ${ status }` );
		expect( dialog ).toHaveTextContent( explanation );
	} );

	it.each( [
		[ 'On', 'automatic rules run', true, true, wafConfig( { jetpack_waf_automatic_rules: '1' } ) ],
		[ 'Off', 'the plugin is inactive', false, true, wafConfig( {} ) ],
		[ 'Off', 'the site is disconnected', true, false, wafConfig( {} ) ],
		[
			'Off',
			'a host firewall site is disconnected',
			true,
			false,
			wafConfig( { waf_supported: false, waf_enabled: false } ),
		],
		[ 'Inactive', 'the firewall data failed to load', true, true, undefined ],
	] )(
		'shows %s with nothing to explain when %s',
		( status, _, isPluginActive, isSiteConnected, data ) => {
			mockConnection.isSiteConnected = isSiteConnected;
			mockUseProduct.mockReturnValue( { detail: { isPluginActive, hasPaidPlanForProduct: true } } );
			render( <FirewallStatus data={ data } /> );

			expect( screen.getByText( status ) ).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'More about Firewall' } )
			).not.toBeInTheDocument();
		}
	);
} );
