/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { MembershipsButtonEdit } from '../edit';

describe( 'MembershipsButtonEdit', () => {
	const defaultAttributes = {
		planId: null,
	};

	const setAttributes = jest.fn();
	const updateBlockAttributes = jest.fn();
	const onRemove = jest.fn();
	const onReplace = jest.fn();
	const autosaveAndRedirect = jest.fn();

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
			currency: "EUR",
			price: "5.00",
			interval: "1 year",
			title: "five a year",
		}
	];
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

	const defaultApiResponse = {
		connect_url: '',
		connected_account_id: 1,
		products: defaultProducts,
		should_upgrade_to_access_memberships: false,
		site_slug: 'test',
		upgrade_url: 'https://wordpress.com/checkout/test/jetpack_security_daily_monthly',
	};

	jest.mock( '../../../shared/get-jetpack-extension-availability', () => () => ( {
		available: false,
		unavailableReason: 'missing_plan',
	} ) );

	// Mock out InnerBlocks.
	jest.mock( '@wordpress/block-editor', () => ( {
		...jest.requireActual( '@wordpress/block-editor' ),
		InnerBlocks: () => ( '' ),
	} ) );

	const originalFetch = window.fetch;

	beforeEach( () => {
		setAttributes.mockClear();
		updateBlockAttributes.mockClear();
		onRemove.mockClear();
		onReplace.mockClear();
		autosaveAndRedirect.mockClear();

		window.fetch = jest.fn();
		window.fetch.mockReturnValue(
			Promise.resolve( {
				status: 200,
				json: () => Promise.resolve( defaultApiResponse )
			} )
		);
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	test( 'loads and displays button with placeholder text', async () => {
		render( <MembershipsButtonEdit { ...defaultProps } /> );

		expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
			'/wpcom/v2/memberships/status?_locale=user'
		);

		await waitFor( () => expect( screen.getByText( 'Payments' ) ).toBeInTheDocument() );
	} );

	describe( 'when a plan has been selected', () => {
		test( 'the Payment Plan form does not display', async () => {
			const props = { ...defaultProps, attributes: { planId: 1 } };
			render( <MembershipsButtonEdit { ...props } /> );

			expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
				'/wpcom/v2/memberships/status?_locale=user'
			);

			await waitFor( () => expect( screen.queryByText( 'Payments' ) ).not.toBeInTheDocument() );
		} );

		test( 'the Upgrade nudge does not display', async () => {
			const props = { ...defaultProps, attributes: { planId: 1 } };
			render( <MembershipsButtonEdit { ...props } /> );

			expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
				'/wpcom/v2/memberships/status?_locale=user'
			);

			await waitFor( () => expect( screen.queryByText( 'Upgrade your plan' ) ).not.toBeInTheDocument() );
		} );
	} );

	describe( 'when the site requires an upgrade', () => {
		test( 'the upgrade nudge displays', async () => {
			const apiResponse = {
				...defaultApiResponse,
				should_upgrade_to_access_memberships: true,
			};
			window.fetch.mockReturnValue(
				Promise.resolve( {
					status: 200,
					json: () => Promise.resolve( apiResponse )
				} )
			);
			render( <MembershipsButtonEdit { ...defaultProps } /> );

			expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
				'/wpcom/v2/memberships/status?_locale=user'
			);

			await waitFor( () => expect( screen.queryByText( 'Upgrade your plan' ) ).toBeInTheDocument() );
		} );
	} );
} );
