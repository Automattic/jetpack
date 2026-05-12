jest.mock( '@automattic/jetpack-analytics', () => ( {
	tracks: {
		recordEvent: jest.fn(),
	},
} ) );

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

jest.mock( '../../../store', () => ( {
	STORE_ID: 'jetpack-search-plugin',
} ) );

import analytics from '@automattic/jetpack-analytics';
import { select } from '@wordpress/data';
import { updateJetpackSettings } from '../jetpack-settings';

const defaultSearchModuleStatus = {
	module_active: true,
	instant_search_enabled: true,
	experience: 'overlay',
	reader_chat: false,
};

const selectors = {
	getSearchModuleStatus: jest.fn(),
	isReaderChatEnabled: jest.fn(),
	isWpcom: jest.fn(),
};

const advanceSuccessfulUpdate = (
	action,
	updatedSettings = {},
	savedSettings = updatedSettings
) => {
	// Create notice 'Updating'.
	expect( action.next().value.type ).toBe( 'CREATE_NOTICE' );
	// Set state updating flag.
	expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
	// Set state to the target state.
	expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
	// Post new settings to API.
	expect( action.next().value.type ).toBe( 'UPDATE_JETPACK_SETTINGS' );
	// Fetch settings from API.
	expect( action.next( savedSettings ).value.type ).toBe( 'FETCH_JETPACK_SETTINGS' );
	// Set fetched setting from above step.
	expect( action.next( updatedSettings ).value.type ).toBe( 'SET_JETPACK_SETTINGS' );
};

describe( 'Jetpack Settings updateJetpackSettings action', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		selectors.getSearchModuleStatus.mockReturnValue( defaultSearchModuleStatus );
		selectors.isReaderChatEnabled.mockReturnValue( false );
		selectors.isWpcom.mockReturnValue( true );
		select.mockReturnValue( selectors );
	} );

	test( 'yield setJetpackSettings state to new one', () => {
		const action = updateJetpackSettings();

		advanceSuccessfulUpdate( action );

		// Remove 'Updating' notice.
		expect( action.next().value.type ).toBe( 'REMOVE_NOTICE' );
		// Remove state updating flag.
		expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
		// Create success notice.
		expect( action.next().value.type ).toBe( 'CREATE_NOTICE' );
	} );

	test( 'records Reader Chat toggle tracking after a successful setting change', () => {
		const action = updateJetpackSettings( { reader_chat: true } );

		advanceSuccessfulUpdate( action, { reader_chat: true } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_reader_chat_toggle', {
			enabled: true,
			previous_enabled: false,
			is_wpcom: true,
			surface: 'jetpack_search_dashboard',
		} );

		// Remove 'Updating' notice.
		expect( action.next().value.type ).toBe( 'REMOVE_NOTICE' );
	} );

	test( 'records Reader Chat toggle tracking after disabling Reader Chat', () => {
		selectors.isReaderChatEnabled.mockReturnValueOnce( true );
		const action = updateJetpackSettings( { reader_chat: false } );

		advanceSuccessfulUpdate( action, { reader_chat: false } );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_reader_chat_toggle', {
			enabled: false,
			previous_enabled: true,
			is_wpcom: true,
			surface: 'jetpack_search_dashboard',
		} );
	} );

	test( 'does not record Reader Chat tracking when the saved value is unchanged', () => {
		selectors.isReaderChatEnabled.mockReturnValueOnce( true );
		const action = updateJetpackSettings( { reader_chat: true } );

		advanceSuccessfulUpdate( action, { reader_chat: true } );

		// Remove 'Updating' notice.
		expect( action.next().value.type ).toBe( 'REMOVE_NOTICE' );
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
	} );

	test( 'records Reader Chat tracking after the setting saves even when refetching settings fails', () => {
		const action = updateJetpackSettings( { reader_chat: true } );

		// Create notice 'Updating'.
		expect( action.next().value.type ).toBe( 'CREATE_NOTICE' );
		// Set state updating flag.
		expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
		// Set state to the target state.
		expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
		// Post new settings to API.
		expect( action.next().value.type ).toBe( 'UPDATE_JETPACK_SETTINGS' );
		// Fetch settings from API.
		expect( action.next( { reader_chat: true } ).value.type ).toBe( 'FETCH_JETPACK_SETTINGS' );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_reader_chat_toggle', {
			enabled: true,
			previous_enabled: false,
			is_wpcom: true,
			surface: 'jetpack_search_dashboard',
		} );

		// Restore previous settings after the failed refetch.
		expect( action.throw( new Error( 'Fetch failed' ) ).value ).toEqual( {
			type: 'SET_JETPACK_SETTINGS',
			options: defaultSearchModuleStatus,
		} );
	} );

	test( 'does not record Reader Chat tracking when the setting update fails', () => {
		const action = updateJetpackSettings( { reader_chat: true } );

		// Create notice 'Updating'.
		expect( action.next().value.type ).toBe( 'CREATE_NOTICE' );
		// Set state updating flag.
		expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
		// Set state to the target state.
		expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
		// Post new settings to API.
		expect( action.next().value.type ).toBe( 'UPDATE_JETPACK_SETTINGS' );
		selectors.getSearchModuleStatus.mockReturnValue( {
			module_active: true,
			instant_search_enabled: true,
			experience: 'overlay',
			reader_chat: true,
		} );
		// Restore previous settings after the failed save.
		expect( action.throw( new Error( 'Save failed' ) ).value ).toEqual( {
			type: 'SET_JETPACK_SETTINGS',
			options: {
				module_active: true,
				instant_search_enabled: true,
				experience: 'overlay',
				reader_chat: false,
			},
		} );

		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
	} );
} );
