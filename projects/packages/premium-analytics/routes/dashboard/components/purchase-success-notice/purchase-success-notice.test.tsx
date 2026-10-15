/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const recordEvent = jest.mocked( analytics.tracks.recordEvent );

type PurchaseSuccess = { type: 'paid' | 'free'; is_commercial?: boolean };

/**
 * Seeds the script data the server prints after a checkout return.
 *
 * @param purchase - The purchase the checkout reported, or none.
 */
function setPurchase( purchase?: PurchaseSuccess ) {
	window.JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/', wpcom: { blog_id: 123456789 } },
		premium_analytics: { initial_full_sync_finished: 1, purchase_success: purchase },
	} as typeof window.JetpackScriptData;
}

describe( 'PurchaseSuccessNotice', () => {
	beforeEach( () => {
		resetPurchaseSuccessNoticeForTesting();
		recordEvent.mockClear();
		window.history.replaceState( null, '', '/wp-admin/admin.php' );
	} );

	it.each( [
		[ true, 'instant access to upcoming features and priority support' ],
		[ false, 'stop seeing the upgrade banners' ],
	] )( 'thanks a paid purchase in the copy for is_commercial: %s', ( isCommercial, copy ) => {
		setPurchase( { type: 'paid', is_commercial: isCommercial } );

		const { container } = render( <PurchaseSuccessNotice /> );

		expect( container ).toHaveTextContent( 'Thank you for supporting Jetpack Stats!' );
		expect( container ).toHaveTextContent( copy );
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'asks a free purchase to consider upgrading', async () => {
		setPurchase( { type: 'free' } );

		const { container } = render( <PurchaseSuccessNotice /> );
		const link = screen.getByRole( 'link', { name: 'please consider upgrading' } );
		link.addEventListener( 'click', event => event.preventDefault() );
		await userEvent.click( link );

		expect( container ).toHaveTextContent( 'Thank you for using Jetpack Stats!' );
		expect( link ).toHaveAttribute(
			'href',
			expect.stringContaining(
				'#!/stats/purchase/123456789?from=jetpack-free-stats-purchase-success-notice&productType=commercial'
			)
		);
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_purchase_success_notice_upgrade_click',
			undefined
		);
	} );

	it( 'says nothing on a load that did not return from checkout', () => {
		setPurchase();

		const { container } = render( <PurchaseSuccessNotice /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'drops the checkout flag from the address and keeps the rest', () => {
		setPurchase( { type: 'paid' } );
		window.history.replaceState(
			null,
			'',
			'/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&statsPurchaseSuccess=paid&p=%2F'
		);

		render( <PurchaseSuccessNotice /> );

		expect( window.location.search ).toBe( '?page=jetpack-premium-analytics-wp-admin&p=%2F' );
	} );

	it( 'stays dismissed when another section tab mounts it', async () => {
		setPurchase( { type: 'paid' } );

		const { unmount } = render( <PurchaseSuccessNotice /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		unmount();
		const { container } = render( <PurchaseSuccessNotice /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
