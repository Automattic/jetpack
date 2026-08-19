import useConnection from '@automattic/jetpack-connection/use-connection';
import { isJetpackSelfHostedSite, isSimpleSite } from '@automattic/jetpack-script-data';
import { renderHook, act } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { hasSocialPaidFeatures } from '../../../utils';
import useSocialGate from '../use-social-gate';

jest.mock( '@automattic/jetpack-connection/use-connection', () => jest.fn() );
jest.mock( '@wordpress/data', () => ( { useSelect: jest.fn(), useDispatch: () => ( {} ) } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isJetpackSelfHostedSite: jest.fn(),
	isSimpleSite: jest.fn(),
} ) );
jest.mock( '../../../utils', () => ( { hasSocialPaidFeatures: jest.fn() } ) );
jest.mock( '../../../social-store', () => ( { store: {} } ) );

const mockState = ( {
	isRegistered = true,
	isUserConnected = true,
	showPricingPage = false,
	paid = true,
	jetpackSite = true,
	simple = false,
} ) => {
	( useConnection as jest.Mock ).mockReturnValue( { isRegistered, isUserConnected } );
	( useSelect as jest.Mock ).mockReturnValue( showPricingPage );
	( hasSocialPaidFeatures as jest.Mock ).mockReturnValue( paid );
	( isJetpackSelfHostedSite as jest.Mock ).mockReturnValue( jetpackSite );
	( isSimpleSite as jest.Mock ).mockReturnValue( simple );
};

describe( 'useSocialGate', () => {
	it( 'returns "connection" when not registered', () => {
		mockState( { isRegistered: false } );
		expect( renderHook( () => useSocialGate() ).result.current.gate ).toBe( 'connection' );
	} );

	it( 'returns "connection" when user not connected', () => {
		mockState( { isUserConnected: false } );
		expect( renderHook( () => useSocialGate() ).result.current.gate ).toBe( 'connection' );
	} );

	it( 'returns "pricing" when connected, jetpack, free, nudge not dismissed', () => {
		mockState( { paid: false, showPricingPage: true, jetpackSite: true } );
		expect( renderHook( () => useSocialGate() ).result.current.gate ).toBe( 'pricing' );
	} );

	it( 'returns null on a WPcom (non-Jetpack) site even when pricing would show', () => {
		mockState( { paid: false, showPricingPage: true, jetpackSite: false } );
		expect( renderHook( () => useSocialGate() ).result.current.gate ).toBeNull();
	} );

	it( 'never gates on a WPCOM Simple site, even when disconnected', () => {
		mockState( { isRegistered: false, isUserConnected: false, simple: true } );
		expect( renderHook( () => useSocialGate() ).result.current.gate ).toBeNull();
	} );

	it( 'returns null on the happy path', () => {
		mockState( {} );
		expect( renderHook( () => useSocialGate() ).result.current.gate ).toBeNull();
	} );

	it( 'returns null when connected and free but the pricing nudge should not show', () => {
		mockState( { paid: false, showPricingPage: false, jetpackSite: true } );
		expect( renderHook( () => useSocialGate() ).result.current.gate ).toBeNull();
	} );

	it( 'returns null after dismissPricing is called', () => {
		mockState( { paid: false, showPricingPage: true, jetpackSite: true } );
		const { result } = renderHook( () => useSocialGate() );
		expect( result.current.gate ).toBe( 'pricing' );
		act( () => result.current.dismissPricing() );
		expect( result.current.gate ).toBeNull();
	} );
} );
