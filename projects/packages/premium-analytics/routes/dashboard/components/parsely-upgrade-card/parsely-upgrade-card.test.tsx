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
import { ParselyUpgradeCard, resetParselyUpgradeCardForTesting } from './parsely-upgrade-card';

const mockScriptData = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getScriptData: () => mockScriptData(),
} ) );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useSiteHomeUrl: () => 'https://example.com',
} ) );

jest.mock(
	'@jetpack-premium-analytics/widgets-toolkit',
	() =>
		jest.requireActual( '../../../../tests/js/dashboard-toolkit-test-utils' ).mockDashboardToolkit
);

const { mockRecordEvent } = jest.requireActual(
	'../../../../tests/js/dashboard-toolkit-test-utils'
);

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | null ) => void;
};

const setClosedAt = ( value: string | null ) =>
	( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		DASHBOARD_PARSELY_UPGRADE_CARD_KEY,
		value
	);

describe( 'ParselyUpgradeCard', () => {
	beforeEach( () => {
		resetParselyUpgradeCardForTesting();
		mockRecordEvent.mockClear();
		mockScriptData.mockReturnValue( { premium_analytics: { offers_parsely_prompts: true } } );
		setClosedAt( null );
	} );

	it( 'sends a qualifying reader to the Parsely signup with the site filled in', () => {
		render( <ParselyUpgradeCard enabled /> );

		expect( screen.getByRole( 'link', { name: /Upgrade to Parsely/ } ) ).toHaveAttribute(
			'href',
			'https://dash.parsely.com/self-serve?utm_source=jetpack&url=https%3A%2F%2Fexample.com'
		);
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_parsely_upgrade_view',
			{ source: 'traffic_card' }
		);
	} );

	it.each( [
		[ 'the site does not qualify', { premium_analytics: { offers_parsely_prompts: false } }, true ],
		[ 'the server published no answer', { premium_analytics: {} }, true ],
		[ 'the surface holds it back', { premium_analytics: { offers_parsely_prompts: true } }, false ],
	] )( 'renders nothing when %s', ( _case, scriptData, enabled ) => {
		mockScriptData.mockReturnValue( scriptData );

		const { container } = render( <ParselyUpgradeCard enabled={ enabled } /> );

		expect( container ).toBeEmptyDOMElement();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );

	it( 'stays closed for a reader who dismissed it', async () => {
		const user = userEvent.setup();
		const { container, unmount } = render( <ParselyUpgradeCard enabled /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( container ).toBeEmptyDOMElement();
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_parsely_upgrade_dismiss',
			{ source: 'traffic_card' }
		);

		// A later page load has only the stored preference to go by.
		unmount();
		resetParselyUpgradeCardForTesting();
		const { container: nextLoad } = render( <ParselyUpgradeCard enabled /> );

		expect( nextLoad ).toBeEmptyDOMElement();
	} );
} );
