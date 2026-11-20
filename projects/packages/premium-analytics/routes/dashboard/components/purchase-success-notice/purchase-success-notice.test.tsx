/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	PurchaseSuccessNotice,
	resetPurchaseSuccessNoticeForTesting,
} from './purchase-success-notice';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/route', () => ( {
	Link: jest.requireActual( '../../../../tests/js/route-test-utils' ).mockWordPressRoute.Link,
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const recordEvent = jest.mocked( analytics.tracks.recordEvent );

/**
 * Seeds the script data the server prints after a checkout return.
 *
 * @param type - The purchase the checkout reported, or none.
 */
function setPurchase( type?: 'paid' | 'free' ) {
	window.JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/', wpcom: { blog_id: 123456789 } },
		premium_analytics: {
			initial_full_sync_finished: 1,
			purchase_success: type ? { type } : undefined,
		},
	} as typeof window.JetpackScriptData;
}

/**
 * Answers the site record request the way Connection's `/jetpack/v4/site` does.
 *
 * @param isCommercial - WordPress.com's classification.
 */
function answerSiteRecord( isCommercial: boolean ) {
	mockApiFetch.mockResolvedValue( {
		code: 'success',
		data: JSON.stringify( { options: { is_commercial: isCommercial } } ),
	} );
}

describe( 'PurchaseSuccessNotice', () => {
	beforeEach( () => {
		queryClient.clear();
		resetPurchaseSuccessNoticeForTesting();
		recordEvent.mockClear();
		mockApiFetch.mockReset();
		window.history.replaceState( null, '', '/wp-admin/admin.php' );
	} );

	it.each( [
		[ 'commercial', () => answerSiteRecord( true ), 'instant access to upcoming features' ],
		[ 'not commercial', () => answerSiteRecord( false ), 'stop seeing the upgrade banners' ],
		[
			'unreadable',
			() => mockApiFetch.mockRejectedValue( new Error( 'offline' ) ),
			'stop seeing the upgrade banners',
		],
	] )(
		'thanks a paid purchase on a site WordPress.com reports as %s',
		async ( _, answer, copy ) => {
			answer();
			setPurchase( 'paid' );

			const { container } = render( <PurchaseSuccessNotice /> );

			await expect(
				within( container ).findByText( 'Thank you for supporting Jetpack Stats!' )
			).resolves.toBeVisible();
			expect( container ).toHaveTextContent( copy );
			expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
			expect( mockApiFetch ).toHaveBeenCalledWith( { path: '/jetpack/v4/site' } );
		}
	);

	it( 'asks a free purchase to consider upgrading', async () => {
		setPurchase( 'free' );

		const { container } = render( <PurchaseSuccessNotice /> );
		const link = screen.getByRole( 'link', { name: 'please consider upgrading' } );
		link.addEventListener( 'click', event => event.preventDefault() );
		await userEvent.click( link );

		expect( container ).toHaveTextContent( 'Thank you for using Jetpack Stats!' );
		expect(
			screen.getByText( 'Thank you for using Jetpack Stats!', { selector: '#a11y-speak-polite' } )
		).toBeInTheDocument();
		expect( link ).toHaveAttribute(
			'href',
			expect.stringContaining( '/upgrade?source=jetpack-free-stats-purchase-success-notice' )
		);
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_purchase_success_notice_upgrade_click',
			undefined
		);
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'says nothing on a load that did not return from checkout', () => {
		setPurchase();

		const { container } = render( <PurchaseSuccessNotice /> );

		expect( container ).toBeEmptyDOMElement();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'drops the checkout flag from the address and keeps the rest', () => {
		setPurchase( 'free' );
		window.history.replaceState(
			null,
			'',
			'/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&statsPurchaseSuccess=free&p=%2F'
		);

		render( <PurchaseSuccessNotice /> );

		expect( window.location.search ).toBe( '?page=jetpack-premium-analytics-wp-admin&p=%2F' );
	} );

	it( 'stays dismissed when another section tab mounts it', async () => {
		answerSiteRecord( true );
		setPurchase( 'paid' );

		const { unmount } = render( <PurchaseSuccessNotice /> );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Dismiss' } ) );
		unmount();
		const { container } = render( <PurchaseSuccessNotice /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
