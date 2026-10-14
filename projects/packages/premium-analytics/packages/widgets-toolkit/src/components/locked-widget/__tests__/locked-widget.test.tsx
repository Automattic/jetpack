/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { LockedPage, LockedWidget } from '../locked-widget';

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

const UPGRADE_URL = 'https://example.com/upgrade';

describe( 'locked states', () => {
	beforeEach( () => {
		recordEvent.mockClear();
		( getScriptData as jest.Mock ).mockReturnValue( {
			premium_analytics: {
				plan_gates: {
					tier: 'paid',
					locked_features: { utm: UPGRADE_URL, devices: '', 'plugin-feature': UPGRADE_URL },
					locked_widget_types: {},
				},
			},
		} );
	} );

	it.each( [
		[ 'widget', <LockedWidget key="widget" feature="utm" /> ],
		[ 'page', <LockedPage key="page" feature="utm" /> ],
	] )( 'shows the %s copy with its support link and the upgrade button', ( _, element ) => {
		render( element );

		expect( screen.getByRole( 'link', { name: /campaign performance data/ } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/support/jetpack-stats/traffic-dashboard/#harnessing-utm-stats-for-precision-tracking'
		);
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			UPGRADE_URL
		);
	} );

	it( 'falls back to the generic copy for a feature without its own', () => {
		render( <LockedWidget feature="plugin-feature" /> );

		expect( screen.getByText( 'Upgrade your plan to unlock Jetpack Stats.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
	} );

	it( 'drops the button when there is nowhere to buy', () => {
		render( <LockedWidget feature="devices" /> );

		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'records which feature the upgrade was for', async () => {
		render( <LockedWidget feature="utm" /> );
		// jsdom cannot follow the link.
		document.addEventListener( 'click', event => event.preventDefault(), { once: true } );

		await userEvent.click( screen.getByRole( 'link', { name: 'Upgrade' } ) );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_plan_upgrade_click', {
			feature: 'utm',
			source: 'locked_widget',
		} );
	} );
} );
