/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { render, screen, waitFor } from '@testing-library/react';
import { JETPACK_DATA_PATH } from '@automattic/jetpack-shared-extension-utils';

// We need to mock InnerBlocks before importing our edit component as it requires the Gutenberg store setup
// to operate
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <button>Mocked button</button>,
} ) );

/**
 * Internal dependencies
 */
import Edit from '../edit';

import { settings } from '../../button';
import { registerBlocks } from '../../../shared/test/block-fixtures';
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
		postLink: new URL( 'https://anyposturl.com/' ),
		noticeList: [],
		isSelected: true,
		context: {},
	};

	const defaultProducts = [
		{
			id: 1,
			currency: 'USD',
			price: '10.00',
			interval: '1 month',
			title: 'ten a month',
		},
		{
			id: 2,
			currency: 'DKK',
			price: '5.00',
			interval: '1 year',
			title: 'five a year',
		},
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
			json: () => Promise.resolve( data ),
		} );
	}

	describe( 'when a plan has been selected', () => {
		test( 'the Upgrade nudge does not display', async () => {
			const props = {
				...defaultProps,
				attributes: {
					planId: 1,
					uniqueId: 'recurring-payments-1',
					url: 'https://anyposturl.com/?recurring_payments=1',
				},
			};
			render( <Edit { ...props } /> );

			await waitFor( () =>
				expect( screen.queryByText( 'Upgrade your plan' ) ).not.toBeInTheDocument()
			);
		} );
	} );

	describe( 'when the site requires an upgrade', () => {
		/* This will be re-enabled in a follow-up PR.
		test( 'the upgrade nudge does not display if the block is part of a Premium Content block', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { should_upgrade_to_access_memberships: true } )
			);
			const props = { ...defaultProps, context: { isPremiumContentChild: true } };
			render( <Edit { ...props } /> );

			await waitFor( () =>
				expect( screen.queryByText( 'Upgrade your plan' ) ).not.toBeInTheDocument()
			);
		} );
		*/
	} );
} );
