/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { queryByText, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';

// We need to mock InnerBlocks before importing our edit component as it requires the Gutenberg store setup
// to operate
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <button>Mocked button</button>,
} ) );

/**
 * Internal dependencies
 */
import { MembershipsButtonEdit } from '../edit';

import { settings } from '../../button';
import { registerBlocks } from '../../../shared/test/block-fixtures';
import { JETPACK_DATA_PATH } from '../../../shared/get-jetpack-data';
import userEvent from '@testing-library/user-event';

registerBlocks( [ { name: 'jetpack/button', settings } ] );

describe( 'MembershipsButtonEdit', () => {
	const defaultAttributes = {
		planId: null,
	};

	const setAttributes = jest.fn();
	const updateBlockAttributes = jest.fn();
	const onRemove = jest.fn();
	const onReplace = jest.fn();
	const autosaveAndRedirect = jest.fn();

	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		updateBlockAttributes,
		onRemove,
		onReplace,
		autosaveAndRedirect,
		clientId: 1,
		postId: 1,
		noticeList: [],
		isSelected: true,
		context: { },
	};

	const defaultProducts = [
		{
			id: 1,
			currency: "USD",
			price: "10.00",
			interval: "1 month",
			title: "ten a month",
		},
		{
			id: 2,
			currency: "DKK",
			price: "5.00",
			interval: "1 year",
			title: "five a year",
		}
	];

	const defaultFetchData = {
		connect_url: '',
		connected_account_id: 1,
		products: [],
		should_upgrade_to_access_memberships: false,
		site_slug: 'test',
		upgrade_url: 'https://wordpress.com/checkout/test/jetpack_security_daily_monthly',
	};

	const defaultApiResponse = Promise.resolve( {
		status: 200,
		json: () => Promise.resolve( defaultFetchData ),
	} );

	const defaultAvailability = {
		available: true,
		unavailable_reason: undefined,
	};

	const originalFetch = window.fetch;
	const originalJetpackData = window[ JETPACK_DATA_PATH ];

	beforeEach( () => {
		setAttributes.mockClear();
		updateBlockAttributes.mockClear();
		onRemove.mockClear();
		onReplace.mockClear();
		autosaveAndRedirect.mockClear();

		window.fetch = jest.fn();
		window.fetch.mockReturnValue( defaultApiResponse );
		window[ JETPACK_DATA_PATH ] = {
			available_blocks: defaultAvailability,
		};
	} );

	afterAll( () => {
		window.fetch = originalFetch;
		window[ JETPACK_DATA_PATH ] = originalJetpackData;
	} );

	function getApiResponse( overrides ) {
		const data = {
			...defaultFetchData,
			...overrides,
		};
		return Promise.resolve( {
			status: 200,
			json: () => Promise.resolve( data )
		} );
	}

	describe( 'when a plan has been selected', () => {
		test( 'the Payment Plan form does not display', async () => {
			const props = { ...defaultProps, attributes: { planId: 1 } };
			render( <MembershipsButtonEdit { ...props } /> );

			await waitFor( () => expect( screen.queryByText( 'Payments' ) ).not.toBeInTheDocument() );
		} );

		test( 'the Upgrade nudge does not display', async () => {
			const props = { ...defaultProps, attributes: { planId: 1 } };
			render( <MembershipsButtonEdit { ...props } /> );

			await waitFor( () => expect( screen.queryByText( 'Upgrade your plan' ) ).not.toBeInTheDocument() );
		} );
	} );

	describe( 'when the site requires an upgrade', () => {
		test( 'the upgrade nudge displays', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { should_upgrade_to_access_memberships: true } )
			);
			render( <MembershipsButtonEdit { ...defaultProps } /> );

			await waitFor( () => expect( screen.queryByText( 'Upgrade your plan' ) ).toBeInTheDocument() );
		} );

		test( 'the upgrade nudge does not display if the jetpack nudge is already displayed', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { should_upgrade_to_access_memberships: true } )
			);

			// On a Jetpack site the extension availability will be set to unavailable due to a missing plan,
			// and the Jetpack upgrade nudge will be automatically added on the server side -- so the
			// block-specific nudge should not also display.
			window[ JETPACK_DATA_PATH ] = {
				available_blocks: {
				  'recurring-payments': {
					available: false,
					unavailable_reason: 'missing_plan'
				  },
				}
			  };
			render( <MembershipsButtonEdit { ...defaultProps } /> );

			await waitFor( () => expect( screen.queryByText( 'Upgrade your plan' ) ).not.toBeInTheDocument() );
		} );

		test( 'the upgrade nudge does not display if the block is part of a Premium Content block', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { should_upgrade_to_access_memberships: true } )
			);
			const props = { ...defaultProps, context: { isPremiumContentChild: true } };
			render( <MembershipsButtonEdit { ...props } /> );

			await waitFor( () => expect( screen.queryByText( 'Upgrade your plan' ) ).not.toBeInTheDocument() );
		} );
	} );

	describe( 'the Payments form', () => {
		test( 'should not display if Stripe is not connected', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { connected_account_id: undefined } )
			);
			render( <MembershipsButtonEdit { ...defaultProps } /> );

			await waitFor( () => expect( screen.queryByText( 'Payments' ) ).not.toBeInTheDocument() );
		} );

		test( 'should not display if the block is part of a Premium Content block', async () => {
			const props = { ...defaultProps, context: { isPremiumContentChild: true } };
			render( <MembershipsButtonEdit { ...props } /> );

			await waitFor( () => expect( screen.queryByText( 'Payments' ) ).not.toBeInTheDocument() );
		} );

		test( 'displays formatted buttons for all existing plans', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { products: defaultProducts } )
			);

			render( <MembershipsButtonEdit { ...defaultProps } /> );

			await waitFor( () => expect(
				screen.getByText( 'To use this block, select a previously created payment plan.' ) ).toBeInTheDocument()
			);
			await waitFor( () => expect( screen.getByText( '$10.00 / month' ) ).toBeInTheDocument() );
			await waitFor( () => expect( screen.getByText( 'kr.5,00 / year' ) ).toBeInTheDocument() );
		} );

		test( 'sets the planId when an existing plan button is clicked', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { products: defaultProducts } )
			);

			const { rerender } = render( <MembershipsButtonEdit { ...defaultProps } /> );

			await waitFor( () => userEvent.click( screen.getByText( '$10.00 / month' ) ) );
			expect( setAttributes ).toHaveBeenCalledWith( { planId: 1 } );

			const props = { ...defaultProps, attributes: { ...defaultAttributes, planId: 1 } };
			rerender( <MembershipsButtonEdit { ...props } /> );

			expect( screen.queryByText( 'Payments' ) ).not.toBeInTheDocument();
		} );

		describe( 'the Add New Payment form', () => {
			test( 'opens when the Add a Payment plan button is clicked', async () => {
				window.fetch.mockReturnValue(
					getApiResponse( { products: defaultProducts } )
				);

				render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => userEvent.click( screen.getByText( 'Add a payment plan' ) ) );
				expect( screen.getByLabelText( 'Currency' ) ).toBeInTheDocument();
			} );

			test( 'closes when the cancel button is hit', async () => {
				window.fetch.mockReturnValue(
					getApiResponse( { products: defaultProducts } )
				);

				render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => userEvent.click( screen.getByText( 'Add a payment plan' ) ) );
				await waitFor( () => userEvent.click( screen.getByText( 'Cancel' ) ) );

				expect( screen.queryByLabelText( 'Currency' ) ).not.toBeInTheDocument();
			} );

			test( 'is displayed by default when the site has no existing plans', async () => {
				render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => expect(
					screen.queryByText( 'To use this block, first add at least one payment plan.' ) ).toBeInTheDocument()
				);
				await waitFor( () => expect( screen.getByLabelText( 'Currency' ) ).toBeInTheDocument() );
				await waitFor( () => expect( screen.getByLabelText( 'Price' ) ).toBeInTheDocument() );
				await waitFor( () => expect( screen.getByLabelText( 'Describe your subscription in a few words' ) ).toBeInTheDocument() );
				await waitFor( () => expect( screen.getByLabelText( 'Renew interval' ) ).toBeInTheDocument() );
				await waitFor( () => expect( screen.getByText( 'Read more about Payments and related fees.' ) ).toBeInTheDocument() );
			} );

			test( 'formats and displays the minimum allowed price', async () => {
				render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => {
					userEvent.selectOptions( screen.getByLabelText( 'Currency' ), [ 'USD' ] );
				} );

				await waitFor( () => expect(
					screen.queryByText( 'Minimum allowed price is $0.50.' ) ).toBeInTheDocument()
				);
			} );

			test( 'updates minimum price when the currency is changed', async () => {
				render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => {
					userEvent.selectOptions( screen.getByLabelText( 'Currency' ), [ 'USD' ] );
					userEvent.selectOptions( screen.getByLabelText( 'Currency' ), [ 'DKK' ] );
				} );

				await waitFor( () => expect(
					screen.queryByText( 'Minimum allowed price is kr.2,50.' ) ).toBeInTheDocument()
				);
			} );

			test( 'adds a new plan and closes the form when the form is submitted', async () => {
				window.fetch
					.mockReturnValueOnce( defaultApiResponse )
					.mockReturnValueOnce(
						Promise.resolve( {
							status: 200,
							json: () => Promise.resolve( defaultProducts[ 0 ] ),
						} )
					);

				const { rerender } = render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => expect( screen.queryByText( 'Payments' ) ).toBeInTheDocument() );

				userEvent.selectOptions( screen.getByLabelText( 'Currency' ), [ 'USD' ] );
				userEvent.clear( screen.getByLabelText( 'Price' ) );
				userEvent.paste( screen.getByLabelText( 'Price' ), '10' );
				userEvent.clear( screen.getByLabelText( 'Describe your subscription in a few words' ) );
				userEvent.type( screen.getByLabelText( 'Describe your subscription in a few words' ), 'ten a month' );
				userEvent.selectOptions( screen.getByLabelText( 'Renew interval' ), [ '1 month' ] );

				userEvent.click( screen.getByText( 'Add this payment plan' ) );

				await waitFor( () => expect( setAttributes ).toHaveBeenCalledWith( { planId: 1 } ) );

				const props = { ...defaultProps, attributes: { ...defaultAttributes, planId: 1 } };
				rerender( <MembershipsButtonEdit { ...props } /> );

				expect( screen.queryByText( 'Payments' ) ).not.toBeInTheDocument();

				expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
					'/wpcom/v2/memberships/status?_locale=user'
				);
				expect( window.fetch.mock.calls[ 1 ][ 0 ] ).toEqual(
					'/wpcom/v2/memberships/product?_locale=user'
				);
			} );

			test( 'does not add the plan if the price is invalid', async () => {
				render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => expect( screen.queryByText( 'Payments' ) ).toBeInTheDocument() );

				userEvent.selectOptions( screen.getByLabelText( 'Currency' ), [ 'USD' ] );
				userEvent.clear( screen.getByLabelText( 'Price' ) );
				userEvent.type( screen.getByLabelText( 'Price' ), '0.25' );

				userEvent.click( screen.getByText( 'Add this payment plan' ) );

				await waitFor( () => expect( setAttributes ).not.toHaveBeenCalled() );
				expect( screen.queryByText( 'Payments' ) ).toBeInTheDocument();
			} );

			test( 'does not add the plan if the description is invalid', async () => {
				render( <MembershipsButtonEdit { ...defaultProps } /> );

				await waitFor( () => expect( screen.queryByText( 'Payments' ) ).toBeInTheDocument() );

				userEvent.clear( screen.getByLabelText( 'Describe your subscription in a few words' ) );
				userEvent.click( screen.getByText( 'Add this payment plan' ) );

				await waitFor( () => expect( setAttributes ).not.toHaveBeenCalled() );
				expect( screen.queryByText( 'Payments' ) ).toBeInTheDocument();
			} );
		} );
	} );
} );
