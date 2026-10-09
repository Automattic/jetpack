import { useStatsSettings } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsSettingsPanel } from './stats-settings';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsSettings: jest.fn(),
} ) );

const mockTrackEvent = jest.fn();
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => mockTrackEvent,
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

const ROLES = [
	{ slug: 'administrator', name: 'Administrator', count: null },
	{ slug: 'editor', name: 'Editor', count: null },
];

const setScriptData = ( featuresUrl: string | null ) => {
	window.JetpackScriptData = {
		premium_analytics: { stats_settings: { roles: ROLES, features_url: featuresUrl } },
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

	it.each( [
		[
			'a switch turning off',
			{},
			async () =>
				userEvent.click(
					screen.getByRole( 'checkbox', { name: 'Include a small chart in admin bar' } )
				),
			[ { setting: 'admin_bar', enabled: false } ],
		],
		[
			'a role added',
			{},
			async () => {
				await userEvent.click(
					screen.getByRole( 'combobox', { name: 'Count logged in page views from' } )
				);
				await userEvent.click( await screen.findByRole( 'option', { name: 'Editor' } ) );
			},
			[ { setting: 'count_roles', enabled: true, role: 'editor' } ],
		],
		[
			'a role removed, without the administrator role the field keeps',
			{ roles: [ 'administrator', 'editor' ] },
			async () => userEvent.click( screen.getByRole( 'button', { name: 'Remove' } ) ),
			[ { setting: 'roles', enabled: false, role: 'editor' } ],
		],
	] )( 'records %s', async ( _title, stored, act, events ) => {
		useStatsSettingsMock.mockReturnValue( {
			settings: { ...SETTINGS, ...stored },
			isError: false,
			saveChange: jest.fn().mockResolvedValue( undefined ),
		} );

		render( <StatsSettingsPanel /> );
		await act();

		expect( mockTrackEvent.mock.calls ).toEqual(
			events.map( event => [ 'jetpack_premium_analytics_settings_changed', event ] )
		);
	} );

	it( 'records nothing when the site refuses the save', async () => {
		useStatsSettingsMock.mockReturnValue( {
			settings: SETTINGS,
			isError: false,
			saveChange: jest.fn().mockRejectedValue( { code: 'offline_error' } ),
		} );

		render( <StatsSettingsPanel /> );
		await userEvent.click(
			screen.getByRole( 'checkbox', { name: 'Include a small chart in admin bar' } )
		);

		expect( mockTrackEvent ).not.toHaveBeenCalled();
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
