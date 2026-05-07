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

const selectors = {
	getSearchModuleStatus: jest.fn( () => ( {
		module_active: true,
		instant_search_enabled: true,
		experience: 'overlay',
		reader_chat: false,
	} ) ),
	isReaderChatEnabled: jest.fn( () => false ),
	isWpcom: jest.fn( () => true ),
};

const advanceSuccessfulUpdate = ( action, updatedSettings = {} ) => {
	// Create notice 'Updating'.
	expect( action.next().value.type ).toBe( 'CREATE_NOTICE' );
	// Set state updating flag.
	expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
	// Set state to the target state.
	expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
	// Post new settings to API.
	expect( action.next().value.type ).toBe( 'UPDATE_JETPACK_SETTINGS' );
	// Fetch settings from API.
	expect( action.next().value.type ).toBe( 'FETCH_JETPACK_SETTINGS' );
	// Set fetched setting from above step.
	expect( action.next( updatedSettings ).value.type ).toBe( 'SET_JETPACK_SETTINGS' );
};

describe( 'Jetpack Settings updateJetpackSettings action', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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

		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();

		// Remove 'Updating' notice.
		expect( action.next().value.type ).toBe( 'REMOVE_NOTICE' );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_reader_chat_toggle', {
			enabled: true,
			previous_enabled: false,
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
		// Restore previous settings after the failed save.
		expect( action.throw( new Error( 'Save failed' ) ).value.type ).toBe( 'SET_JETPACK_SETTINGS' );

		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
	} );
} );
