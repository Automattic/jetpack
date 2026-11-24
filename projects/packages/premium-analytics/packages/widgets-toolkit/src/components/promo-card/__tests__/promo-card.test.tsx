/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { DASHBOARD_PREFERENCES_SCOPE, type Promo } from '@jetpack-premium-analytics/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { resetPromoDismissalForTesting } from '../../../hooks';
import { PromoCard, resetPromoViewsForTesting } from '../promo-card';
import type { PromoRenderProps } from '../types';
import type { ComponentType } from 'react';

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
	render_module: null,
	...overrides,
} );

const seed = ( value: unknown ) =>
	dispatch( preferencesStore ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		'dismissedPromos',
		value as never
	);

function ModuleContent( { promo, trackClick }: PromoRenderProps ) {
	return (
		<button type="button" onClick={ () => trackClick( 'module-link' ) }>
			{ `Module for ${ promo.slug }` }
		</button>
	);
}

function ThrowingModule(): never {
	throw new Error( 'module failed' );
}

const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

const resolving = ( component: ComponentType< PromoRenderProps > ) => () =>
	Promise.resolve( { default: component } );

describe( 'PromoCard', () => {
	beforeEach( () => {
		jest.useFakeTimers();
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

	it( 'fires the view event once per page load for a placement', () => {
		const { unmount } = render( <PromoCard promo={ makePromo() } /> );
		unmount();
		render( <PromoCard promo={ makePromo() } /> );

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
			label: 'Try Acme',
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

	describe( 'with a render module', () => {
		const withModule = makePromo( { render_module: 'acme/promo-module' } );

		it( 'hands the whole content region to the module and draws neither title nor description', async () => {
			const user = setupUser();
			render( <PromoCard promo={ withModule } resolveModule={ resolving( ModuleContent ) } /> );

			await user.click( await screen.findByRole( 'button', { name: 'Module for acme/offer' } ) );

			expect( screen.queryByText( 'Grow with Acme' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Reach more readers.' ) ).not.toBeInTheDocument();
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_promo_click', {
				slug: 'acme/offer',
				placement: 'settings',
				label: 'module-link',
			} );
		} );

		it( 'falls back to the data-only card when the module import rejects', async () => {
			render(
				<PromoCard
					promo={ withModule }
					resolveModule={ () => Promise.reject( new Error( 'import failed' ) ) }
				/>
			);

			await waitFor( () => expect( console ).toHaveErrored() );
			expect( screen.getByText( 'Grow with Acme' ) ).toBeInTheDocument();
		} );

		it( 'falls back to the data-only card when the module throws on render', async () => {
			render( <PromoCard promo={ withModule } resolveModule={ resolving( ThrowingModule ) } /> );

			await waitFor( () => expect( console ).toHaveErrored() );
			expect( screen.getByText( 'Grow with Acme' ) ).toBeInTheDocument();
		} );
	} );
} );
