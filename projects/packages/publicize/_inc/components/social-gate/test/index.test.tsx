import useConnection from '@automattic/jetpack-connection/use-connection';
import { isJetpackSelfHostedSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import SocialGate from '..';
import { hasSocialPaidFeatures } from '../../../utils';

jest.mock( '@automattic/jetpack-connection/use-connection', () => jest.fn() );
jest.mock( '@wordpress/data', () => ( { useSelect: jest.fn(), useDispatch: () => ( {} ) } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { isJetpackSelfHostedSite: jest.fn() } ) );
jest.mock( '../../../utils', () => ( { hasSocialPaidFeatures: jest.fn() } ) );
// Avoid registering the real @wordpress/data store (which the mocked data module
// cannot do): SocialGate only needs the store symbol passed to the mocked useSelect.
jest.mock( '../../../social-store', () => ( { store: {} } ) );
jest.mock( '../connection-gate', () => () => <div>connection-gate</div> );
jest.mock( '../pricing-gate', () => () => <div>pricing-gate</div> );

const mockState = ( {
	isRegistered = true,
	isUserConnected = true,
	showPricingPage = false,
	paid = true,
	jetpackSite = true,
} ) => {
	( useConnection as jest.Mock ).mockReturnValue( { isRegistered, isUserConnected } );
	( useSelect as jest.Mock ).mockReturnValue( showPricingPage );
	( hasSocialPaidFeatures as jest.Mock ).mockReturnValue( paid );
	( isJetpackSelfHostedSite as jest.Mock ).mockReturnValue( jetpackSite );
};

describe( 'SocialGate', () => {
	it( 'renders ConnectionGate when not registered', () => {
		mockState( { isRegistered: false } );
		render(
			<SocialGate>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'connection-gate' ) ).toBeInTheDocument();
	} );

	it( 'renders ConnectionGate when user not connected', () => {
		mockState( { isUserConnected: false } );
		render(
			<SocialGate>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'connection-gate' ) ).toBeInTheDocument();
	} );

	it( 'renders PricingGate when connected, free, and pricing not dismissed', () => {
		mockState( { paid: false, showPricingPage: true, jetpackSite: true } );
		render(
			<SocialGate>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'pricing-gate' ) ).toBeInTheDocument();
	} );

	it( 'renders children on a WPcom (non-Jetpack) site even when pricing would show', () => {
		mockState( { paid: false, showPricingPage: true, jetpackSite: false } );
		render(
			<SocialGate>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'tabs' ) ).toBeInTheDocument();
	} );

	it( 'renders children (tabs) on the happy path', () => {
		mockState( {} );
		render(
			<SocialGate>
				<div>tabs</div>
			</SocialGate>
		);
		expect( screen.getByText( 'tabs' ) ).toBeInTheDocument();
	} );
} );
