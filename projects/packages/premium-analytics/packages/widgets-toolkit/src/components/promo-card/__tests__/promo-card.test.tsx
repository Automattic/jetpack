/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { DASHBOARD_PREFERENCES_SCOPE, type Promo } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { resetPromoDismissalForTesting } from '../../../hooks';
import { PromoCard, resetPromoViewsForTesting } from '../promo-card';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);

const recordEvent = jest.mocked( jetpackAnalytics.tracks.recordEvent );

const DAY = 86400000;

const observed: { element: Element; callback: IntersectionObserverCallback }[] = [];

class TestIntersectionObserver {
	callback: IntersectionObserverCallback;

	constructor( callback: IntersectionObserverCallback ) {
		this.callback = callback;
	}

	observe( element: Element ) {
		observed.push( { element, callback: this.callback } );
	}

	disconnect() {
		for ( let index = observed.length - 1; index >= 0; index-- ) {
			if ( observed[ index ].callback === this.callback ) {
				observed.splice( index, 1 );
			}
		}
	}

	unobserve() {}

	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

const scrollIntoView = () =>
	act( () => {
		observed
			.slice()
			.forEach( ( { element, callback } ) =>
				callback(
					[ { target: element, isIntersecting: true } as IntersectionObserverEntry ],
					{} as IntersectionObserver
				)
			);
	} );

const makePromo = ( overrides: Partial< Promo > = {} ): Promo => ( {
	slug: 'acme/offer',
	placement: 'settings',
	order: 10,
	title: 'Grow with Acme',
	description: 'Reach more readers.',
	cta_label: 'Try Acme',
	cta_url: 'https://example.com/acme',
	dismissible: true,
	snooze_days: 90,
	...overrides,
} );

const seed = ( value: unknown ) =>
	dispatch( preferencesStore ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		'dismissedPromos',
		value as never
	);

const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

describe( 'PromoCard', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		observed.length = 0;
		window.IntersectionObserver =
			TestIntersectionObserver as unknown as typeof window.IntersectionObserver;
		resetPromoDismissalForTesting();
		resetPromoViewsForTesting();
		recordEvent.mockClear();
		seed( {} );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'renders the title, the description and the CTA for a data-only promo', () => {
		render( <PromoCard promo={ makePromo() } /> );

		expect( screen.getByText( 'Grow with Acme' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Reach more readers.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Try Acme/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/acme'
		);
		expect( screen.getByRole( 'img', { name: '(opens in a new tab)' } ) ).toBeInTheDocument();
	} );

	it( 'renders no close control when the promo is not dismissible', () => {
		render( <PromoCard promo={ makePromo( { dismissible: false } ) } /> );

		expect( screen.queryByRole( 'button', { name: 'Dismiss' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing once the promo is dismissed', () => {
		seed( { 'acme/offer': { count: 2, at: new Date().toISOString() } } );

		render( <PromoCard promo={ makePromo() } /> );

		expect( screen.queryByText( 'Grow with Acme' ) ).not.toBeInTheDocument();
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'records no view until the card is scrolled into view', () => {
		render( <PromoCard promo={ makePromo() } /> );

		expect( recordEvent ).not.toHaveBeenCalled();

		scrollIntoView();

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_promo_view', {
			slug: 'acme/offer',
			placement: 'settings',
		} );
	} );

	it( 'fires the view event once per page load for a placement', () => {
		const { unmount } = render( <PromoCard promo={ makePromo() } /> );
		scrollIntoView();
		unmount();
		render( <PromoCard promo={ makePromo() } /> );
		scrollIntoView();

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_promo_view', {
			slug: 'acme/offer',
			placement: 'settings',
		} );
	} );

	it( 'fires the click event with the promo slug and placement', async () => {
		const user = setupUser();
		render( <PromoCard promo={ makePromo() } /> );

		await user.click( screen.getByRole( 'link', { name: /Try Acme/ } ) );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_promo_click', {
			slug: 'acme/offer',
			placement: 'settings',
			label: 'cta',
		} );
	} );

	it( 'fires the dismiss event as a snooze on the first close and hides the card', async () => {
		const user = setupUser();
		render( <PromoCard promo={ makePromo() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_promo_dismiss', {
			slug: 'acme/offer',
			placement: 'settings',
			dismissal: 'snooze',
		} );
		expect( screen.queryByText( 'Grow with Acme' ) ).not.toBeInTheDocument();
	} );

	it( 'parks focus on the surrounding region when the card closes', async () => {
		const user = setupUser();
		const { container } = render( <PromoCard promo={ makePromo() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( container ).toHaveFocus();
	} );

	it( 'fires the dismiss event as final on the second close', async () => {
		seed( { 'acme/offer': { count: 1, at: new Date( Date.now() - 100 * DAY ).toISOString() } } );
		const user = setupUser();
		render( <PromoCard promo={ makePromo() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_promo_dismiss', {
			slug: 'acme/offer',
			placement: 'settings',
			dismissal: 'final',
		} );
	} );

	it( 'renders the label as plain text when the cta_url is not http', () => {
		render( <PromoCard promo={ makePromo( { cta_url: 'javascript:alert(1)' } ) } /> );

		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Try Acme' ) ).toBeInTheDocument();
	} );
} );
