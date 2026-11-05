import { act, render, waitFor } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import Edit from '../edit';
import fetchDefaultProducts from '../fetch-default-products';
import fetchStatus from '../fetch-status';
import { tipsVariationAttributes } from '../tips-variation';

const mockTracks = { recordEvent: jest.fn() };

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: mockTracks } ),
} ) );
jest.mock( '@wordpress/block-editor', () => {
	const { createElement, forwardRef } = require( '@wordpress/element' );
	return {
		store: { name: 'core/block-editor' },
		useBlockProps: props => props,
		// Amount passes RichText a ref, which React 18 only accepts on a forwardRef component.
		RichText: forwardRef( ( { value }, ref ) => createElement( 'span', { ref }, value ) ),
	};
} );
jest.mock( '../../../shared/use-is-user-connected', () => () => true );
jest.mock( '../../../store/membership-products', () => ( {
	store: { name: 'jetpack/membership-products' },
} ) );
jest.mock( '../fetch-status', () => jest.fn() );
jest.mock( '../fetch-default-products', () => jest.fn() );
// Inspector panels, which need a mounted block editor to render.
jest.mock( '../controls', () => () => null );
jest.mock( '../style-controls', () => () => null );

// The order in which the block locks saving, writes its plan IDs and unlocks saving.
let events;
let blockAttributes;

const record = event => () => {
	events.push( event );
	return { type: 'NOOP' };
};
const noop = () => ( { type: 'NOOP' } );
const registry = createRegistry();
registry.registerStore( 'core/block-editor', {
	reducer: () => ( {} ),
	selectors: { getSettings: () => ( {} ), getBlockAttributes: () => blockAttributes },
} );
registry.registerStore( 'core/editor', {
	reducer: () => ( {} ),
	selectors: { getCurrentPost: () => ( { id: 1 } ), isPostSavingLocked: () => false },
	actions: { lockPostSaving: record( 'lock' ), unlockPostSaving: record( 'unlock' ) },
} );
registry.registerStore( 'jetpack/membership-products', {
	reducer: () => ( {} ),
	selectors: { getConnectUrl: () => null, getConnectedAccountDefaultCurrency: () => 'USD' },
	actions: { setConnectUrl: noop, setConnectedAccountDefaultCurrency: noop },
} );
registry.registerStore( 'core/rich-text', {
	reducer: () => ( {} ),
	selectors: { getFormatTypes: () => [] },
} );

const status = {
	connect_url: '',
	connected_account_default_currency: 'usd',
	products: [
		{ id: 11, currency: 'USD', type: 'donation', interval: 'one-time' },
		{ id: 12, currency: 'USD', type: 'donation', interval: '1 month' },
		{ id: 13, currency: 'USD', type: 'donation', interval: '1 year' },
	],
};

const donationsFormAttributes = {
	currency: 'USD',
	oneTimeDonation: { show: true, planId: null, amounts: [ 5, 15, 100 ] },
	monthlyDonation: { show: true, planId: null, amounts: [ 5, 15, 100 ] },
	annualDonation: { show: true, planId: null, amounts: [ 5, 15, 100 ] },
	showCustomAmount: true,
};

// Keeps the attributes in state, as the block editor does, so setAttributes re-renders the block.
const Block = ( { initialAttributes } ) => {
	const [ attributes, setState ] = useState( initialAttributes );
	blockAttributes = attributes;
	const setAttributes = useCallback( updates => {
		if ( updates.oneTimeDonation?.planId ) {
			events.push( 'plans' );
		}
		setState( previous => ( { ...previous, ...updates } ) );
	}, [] );
	return <Edit attributes={ attributes } setAttributes={ setAttributes } clientId="donations-1" />;
};

const renderBlock = initialAttributes =>
	render(
		<RegistryProvider value={ registry }>
			<Block initialAttributes={ initialAttributes } />
		</RegistryProvider>
	);

describe( 'Donations Edit', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		events = [];
		fetchStatus.mockResolvedValue( status );
	} );

	test.each( [
		[ 'a Tips block in Pop-up mode', { ...tipsVariationAttributes, currency: 'USD' } ],
		[ 'a Donations Form in In-page mode', donationsFormAttributes ],
	] )(
		"writes the site's donation plan IDs into %s before saving unlocks",
		async ( _, attributes ) => {
			renderBlock( attributes );

			await waitFor( () => expect( blockAttributes.oneTimeDonation.planId ).toBe( 11 ) );
			expect( blockAttributes.monthlyDonation.planId ).toBe( 12 );
			expect( blockAttributes.annualDonation.planId ).toBe( 13 );
			expect( events ).toEqual( [ 'lock', 'plans', 'unlock' ] );
		}
	);

	test( 'keeps saving locked until the plans it asked WordPress.com to create come back', async () => {
		let createPlans;
		fetchStatus.mockResolvedValue( { ...status, products: [] } );
		fetchDefaultProducts.mockImplementation(
			() => new Promise( resolve => ( createPlans = () => resolve( status.products ) ) )
		);
		renderBlock( donationsFormAttributes );
		await waitFor( () => expect( fetchDefaultProducts ).toHaveBeenCalled() );
		expect( events ).toEqual( [ 'lock' ] );

		await act( async () => createPlans() );
		expect( blockAttributes.oneTimeDonation.planId ).toBe( 11 );
		expect( events ).toEqual( [ 'lock', 'plans', 'unlock' ] );
	} );

	test( 'unlocks saving when the plans cannot be loaded', async () => {
		fetchStatus.mockRejectedValue( 'Network error' );
		renderBlock( donationsFormAttributes );
		await waitFor( () => expect( events ).toEqual( [ 'lock', 'unlock' ] ) );
	} );

	test( 'unlocks saving when the block is removed while its plans load', async () => {
		fetchStatus.mockReturnValue( new Promise( () => {} ) );
		const { unmount } = renderBlock( donationsFormAttributes );
		await waitFor( () => expect( events ).toEqual( [ 'lock' ] ) );

		unmount();
		expect( events ).toEqual( [ 'lock', 'unlock' ] );
	} );

	test( 'keeps saving locked while the fetch for the currency it just picked is in flight', async () => {
		// A new Tips block has no currency, so it picks Stripe's and fetches again.
		const fetches = [];
		fetchStatus.mockImplementation(
			() => new Promise( resolve => fetches.push( () => resolve( status ) ) )
		);
		renderBlock( tipsVariationAttributes );
		await waitFor( () => expect( fetches ).toHaveLength( 2 ) );

		await act( async () => fetches[ 0 ]() );
		expect( events.at( -1 ) ).toBe( 'lock' );

		await act( async () => fetches[ 1 ]() );
		expect( blockAttributes.oneTimeDonation.planId ).toBe( 11 );
		expect( events.slice( -2 ) ).toEqual( [ 'plans', 'unlock' ] );
	} );
} );
