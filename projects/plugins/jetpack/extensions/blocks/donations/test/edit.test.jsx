import { render, waitFor } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import Edit from '../edit';
import fetchStatus from '../fetch-status';
import { tipsVariationAttributes } from '../tips-variation';

const mockTracks = { recordEvent: jest.fn() };

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: mockTracks } ),
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'core/block-editor' },
	useBlockProps: props => props,
	RichText: ( { value } ) => value ?? null,
} ) );
jest.mock( '../../../shared/use-is-user-connected', () => () => true );
jest.mock( '../../../store/membership-products', () => ( {
	store: { name: 'jetpack/membership-products' },
} ) );
jest.mock( '../fetch-status', () => jest.fn() );
jest.mock( '../fetch-default-products', () => jest.fn() );
// Inspector panels, which need a mounted block editor to render.
jest.mock( '../controls', () => () => null );
jest.mock( '../style-controls', () => () => null );

const noop = () => ( { type: 'NOOP' } );
const registry = createRegistry();
registry.registerStore( 'core/block-editor', {
	reducer: () => ( {} ),
	selectors: { getSettings: () => ( {} ) },
} );
registry.registerStore( 'core/editor', {
	reducer: () => ( {} ),
	selectors: { getCurrentPost: () => ( { id: 1 } ), isPostSavingLocked: () => false },
	actions: { lockPostSaving: noop, unlockPostSaving: noop },
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

const donationsFormAttributes = {
	oneTimeDonation: { show: true, planId: null, amounts: [ 5, 15, 100 ] },
	monthlyDonation: { show: true, planId: null, amounts: [ 5, 15, 100 ] },
	annualDonation: { show: true, planId: null, amounts: [ 5, 15, 100 ] },
	showCustomAmount: true,
};

describe( 'Donations Edit', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		fetchStatus.mockResolvedValue( {
			connect_url: '',
			connected_account_default_currency: 'usd',
			products: [
				{ id: 11, currency: 'USD', type: 'donation', interval: 'one-time' },
				{ id: 12, currency: 'USD', type: 'donation', interval: '1 month' },
				{ id: 13, currency: 'USD', type: 'donation', interval: '1 year' },
			],
		} );
	} );

	test.each( [
		[ 'a Tips block in Pop-up mode', tipsVariationAttributes ],
		[ 'a Donations Form in In-page mode', donationsFormAttributes ],
	] )( "writes the site's donation plan IDs into %s", async ( _, attributes ) => {
		const setAttributes = jest.fn();
		render(
			<RegistryProvider value={ registry }>
				<Edit
					attributes={ { ...attributes, currency: 'USD' } }
					setAttributes={ setAttributes }
					clientId="donations-1"
				/>
			</RegistryProvider>
		);

		await waitFor( () =>
			expect( setAttributes ).toHaveBeenCalledWith(
				expect.objectContaining( {
					oneTimeDonation: expect.objectContaining( { planId: 11 } ),
					monthlyDonation: expect.objectContaining( { planId: 12 } ),
					annualDonation: expect.objectContaining( { planId: 13 } ),
				} )
			)
		);
	} );
} );
