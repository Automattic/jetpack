import { JETPACK_DATA_PATH } from '@automattic/jetpack-shared-extension-utils';
import { render, screen, waitFor } from '@testing-library/react';
import { registerBlocks } from '../../../shared/test/block-fixtures';
import { settings } from '../../button';
import Edit from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

// Mock the @wordpress/edit-post, used internally to resolve the fallback URL.
jest.mock( '@wordpress/edit-post', () => jest.fn() );

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

		// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
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

	/**
	 * Get API response.
	 *
	 * @param {object} overrides - Data overrides.
	 * @returns {Promise} Promise resolving to an API response.
	 */
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
		test.skip( 'the upgrade nudge does not display if the block is part of a Premium Content block', async () => {
			window.fetch.mockReturnValue(
				getApiResponse( { should_upgrade_to_access_memberships: true } )
			);
			const props = { ...defaultProps, context: { isPremiumContentChild: true } };
			render( <Edit { ...props } /> );

			await waitFor( () =>
				expect( screen.queryByText( 'Upgrade your plan' ) ).not.toBeInTheDocument()
			);
		} );
	} );
} );
