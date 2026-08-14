import { render, screen } from '@testing-library/react';
import * as wpData from '@wordpress/data';
import PlansSetupDialog from '../index';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAutosaveAndRedirect: () => ( { autosaveAndRedirect: jest.fn() } ),
} ) );

const TIER_COPY = 'create a newsletter tier and choose a price for access to paid content';
const STRIPE_COPY = 'set up or connect your Stripe account';

const mockStore = ( { hasTierPlans, stripeConnectUrl } ) => {
	jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector =>
		selector( () => ( {
			getNewsletterTierProducts: () => ( hasTierPlans ? [ { id: 1 } ] : [] ),
			getConnectUrl: () => stripeConnectUrl,
		} ) )
	);
};

describe( 'PlansSetupDialog', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	test( 'when Stripe is not connected and no newsletter tiers exist, shows both setup steps', () => {
		mockStore( { hasTierPlans: false, stripeConnectUrl: 'https://stripe-connect.example' } );

		render( <PlansSetupDialog showDialog={ true } closeDialog={ jest.fn() } /> );

		expect( screen.getByRole( 'heading', { name: /Set up payments/i } ) ).toBeInTheDocument();
		expect( screen.getByText( /Create a newsletter tier/i ) ).toBeInTheDocument();
		expect( screen.getByText( /Set up or connect your Stripe account/i ) ).toBeInTheDocument();
	} );

	test( 'when Stripe is connected but no newsletter tiers exist, shows only the tier step (NL-705)', () => {
		mockStore( { hasTierPlans: false, stripeConnectUrl: null } );

		render( <PlansSetupDialog showDialog={ true } closeDialog={ jest.fn() } /> );

		expect( screen.getByRole( 'heading', { name: /Add a newsletter tier/i } ) ).toBeInTheDocument();
		expect( screen.getByText( new RegExp( TIER_COPY, 'i' ) ) ).toBeInTheDocument();
		expect( screen.queryByText( new RegExp( STRIPE_COPY, 'i' ) ) ).not.toBeInTheDocument();
	} );

	test( 'when newsletter tiers exist but Stripe is not connected, shows only the Stripe step', () => {
		mockStore( { hasTierPlans: true, stripeConnectUrl: 'https://stripe-connect.example' } );

		render( <PlansSetupDialog showDialog={ true } closeDialog={ jest.fn() } /> );

		expect( screen.getByRole( 'heading', { name: /Connect Stripe/i } ) ).toBeInTheDocument();
		expect( screen.getByText( new RegExp( STRIPE_COPY, 'i' ) ) ).toBeInTheDocument();
		expect( screen.queryByText( new RegExp( TIER_COPY, 'i' ) ) ).not.toBeInTheDocument();
	} );
} );
