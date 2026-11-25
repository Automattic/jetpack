/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import {
	DASHBOARD_PARSELY_UPGRADE_CARD_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
} from '../../hooks/constants';
import {
	ParselyUpgradeCard,
	isParselyUpgradeCardDismissed,
	resetParselyUpgradeCardForTesting,
	type ParselyUpgradeCardDismissal,
} from './parsely-upgrade-card';

const mockScriptData = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getScriptData: () => mockScriptData(),
} ) );

jest.mock(
	'@jetpack-premium-analytics/widgets-toolkit',
	() =>
		jest.requireActual( '../../../../tests/js/dashboard-toolkit-test-utils' ).mockDashboardToolkit
);

const { mockRecordEvent } = jest.requireActual(
	'../../../../tests/js/dashboard-toolkit-test-utils'
);

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => ParselyUpgradeCardDismissal | undefined;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: ParselyUpgradeCardDismissal | null ) => void;
};

const SIGNUP_URL =
	'https://dash.parsely.com/self-serve?utm_source=jetpack&publisher_name=Example&site_domain=example.com';
const offered = {
	premium_analytics: { offers_parsely_prompts: true, parsely_signup_url: SIGNUP_URL },
};

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = ( days: number ) => new Date( Date.now() - days * DAY_MS ).toISOString();

const setDismissal = ( value: ParselyUpgradeCardDismissal | null ) =>
	( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		DASHBOARD_PARSELY_UPGRADE_CARD_KEY,
		value
	);

const getDismissal = () =>
	(
		jest.requireActual( '@wordpress/data' ).select( preferencesStore ) as PreferencesSelectors
	 ).get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_PARSELY_UPGRADE_CARD_KEY );

describe( 'ParselyUpgradeCard', () => {
	beforeEach( () => {
		resetParselyUpgradeCardForTesting();
		mockRecordEvent.mockClear();
		mockScriptData.mockReturnValue( offered );
		setDismissal( null );
	} );

	it( 'sends a qualifying reader to the Parse.ly signup with the site filled in', () => {
		render( <ParselyUpgradeCard enabled /> );

		expect( screen.getByRole( 'link', { name: /Upgrade to Parse\.ly/ } ) ).toHaveAttribute(
			'href',
			SIGNUP_URL
		);
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_parsely_upgrade_view',
			{ source: 'traffic_card' }
		);
	} );

	it.each( [
		[
			'the site does not qualify',
			{ premium_analytics: { offers_parsely_prompts: false, parsely_signup_url: SIGNUP_URL } },
			true,
		],
		[ 'the server published no answer', { premium_analytics: {} }, true ],
		[
			'the server published no signup URL',
			{ premium_analytics: { offers_parsely_prompts: true } },
			true,
		],
		[ 'the surface holds it back', offered, false ],
	] )( 'renders nothing when %s', ( _case, scriptData, enabled ) => {
		mockScriptData.mockReturnValue( scriptData );

		const { container } = render( <ParselyUpgradeCard enabled={ enabled } /> );

		expect( container ).toBeEmptyDOMElement();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'snoozes on the first dismissal and stays closed on the next load', async () => {
		const user = userEvent.setup();
		const { container, unmount } = render( <ParselyUpgradeCard enabled /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( container ).toBeEmptyDOMElement();
		expect( getDismissal() ).toEqual( { count: 1, at: expect.any( String ) } );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_parsely_upgrade_dismiss',
			{ source: 'traffic_card', dismissal: 'snooze' }
		);

		// A later page load has only the stored preference to go by.
		unmount();
		resetParselyUpgradeCardForTesting();
		const { container: nextLoad } = render( <ParselyUpgradeCard enabled /> );

		expect( nextLoad ).toBeEmptyDOMElement();
	} );

	it( 'comes back after the snooze and then closes for good', async () => {
		const user = userEvent.setup();
		setDismissal( { count: 1, at: daysAgo( 91 ) } );

		const { container } = render( <ParselyUpgradeCard enabled /> );
		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( container ).toBeEmptyDOMElement();
		expect( getDismissal() ).toEqual( { count: 2, at: expect.any( String ) } );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_parsely_upgrade_dismiss',
			{ source: 'traffic_card', dismissal: 'final' }
		);
	} );
} );

describe( 'isParselyUpgradeCardDismissed', () => {
	const now = Date.parse( '2026-11-23T12:00:00Z' );
	const at = ( days: number ) => new Date( now - days * DAY_MS ).toISOString();

	it.each( [
		[ 'never closed', undefined, false ],
		[ 'closed once, within the snooze', { count: 1, at: at( 89 ) }, true ],
		[ 'closed once, after the snooze', { count: 1, at: at( 90 ) }, false ],
		[ 'closed twice, long ago', { count: 2, at: at( 400 ) }, true ],
		[ 'closed once, date unreadable', { count: 1, at: 'yesterday' }, true ],
	] )( '%s', ( _case, dismissal, expected ) => {
		expect( isParselyUpgradeCardDismissed( dismissal, now ) ).toBe( expected );
	} );
} );
