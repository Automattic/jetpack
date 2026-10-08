import { useStatsSettings } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsSettingsPanel } from './stats-settings';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsSettings: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => jest.fn(),
} ) );

const mockCreateErrorNotice = jest.fn();
// A spread of the real module reads its lazy exports too early, so only `useDispatch` is swapped.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	return new Proxy( actual, {
		get: ( target, name ) =>
			name === 'useDispatch'
				? () => ( { createErrorNotice: mockCreateErrorNotice, createSuccessNotice: jest.fn() } )
				: target[ name ],
	} );
} );

jest.mock( './plan-usage-card', () => ( { PlanUsageCard: () => null } ) );

const useStatsSettingsMock = useStatsSettings as jest.Mock;

const SETTINGS = {
	admin_bar: true,
	roles: [ 'administrator' ],
	count_roles: [],
	wpcom_reader_views_enabled: true,
};

const setScriptData = ( featuresUrl: string | null ) => {
	window.JetpackScriptData = {
		premium_analytics: { stats_settings: { roles: [], features_url: featuresUrl } },
	} as typeof window.JetpackScriptData;
};

describe( 'StatsSettingsPanel', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setScriptData( null );
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[
			'the reason the site gave',
			{ code: 'stats_settings_invalid_role', message: 'Unknown role `ghost`.' },
			'Your Stats settings could not be saved: Unknown role `ghost`.',
		],
		[
			'no reason when the request never reached the site',
			{ code: 'offline_error', message: 'You are probably offline.' },
			'Your Stats settings could not be saved.',
		],
	] )( 'reports a refused save with %s', async ( _title, error, notice ) => {
		useStatsSettingsMock.mockReturnValue( {
			settings: SETTINGS,
			isError: false,
			saveChange: jest.fn().mockRejectedValue( error ),
		} );

		render( <StatsSettingsPanel /> );
		await userEvent.click(
			screen.getByRole( 'checkbox', { name: 'Include a small chart in admin bar' } )
		);

		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( notice, { type: 'snackbar' } );
	} );

	it( 'says the settings could not be loaded when the site does not return them', () => {
		useStatsSettingsMock.mockReturnValue( {
			settings: undefined,
			isError: true,
			saveChange: jest.fn(),
		} );

		render( <StatsSettingsPanel /> );

		// The Notice also announces its text through a live region, so it appears twice.
		expect(
			screen.getAllByText(
				'Your Stats settings could not be loaded. Reload the page to try again.'
			)
		).not.toHaveLength( 0 );
	} );

	it( 'leaves out the Activation card when there is no Jetpack features screen to link to', () => {
		useStatsSettingsMock.mockReturnValue( {
			settings: SETTINGS,
			isError: false,
			saveChange: jest.fn(),
		} );

		render( <StatsSettingsPanel /> );

		expect( screen.queryByText( 'Activation' ) ).not.toBeInTheDocument();
	} );
} );
