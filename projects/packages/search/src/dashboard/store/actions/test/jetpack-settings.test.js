/**
 * @jest-environment jsdom
 */
import { updateJetpackSettings } from '../jetpack-settings';

describe( 'Jetpack Settings updateJetpackSettings action', () => {
	const action = updateJetpackSettings( undefined, undefined );
	test( 'yield setJetpackSettings state to new one', () => {
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
		expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
		// Remove 'Updating' notice.
		expect( action.next().value.type ).toBe( 'REMOVE_NOTICE' );
		// Remove state updating flag.
		expect( action.next().value.type ).toBe( 'SET_JETPACK_SETTINGS' );
		// Create success notice.
		expect( action.next().value.type ).toBe( 'CREATE_NOTICE' );
	} );
} );
