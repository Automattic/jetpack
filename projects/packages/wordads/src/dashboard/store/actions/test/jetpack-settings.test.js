/**
 * @jest-environment jsdom
 */
/**
 * Internal dependencies
 */
import { updateJetpackSettings } from '../jetpack-settings';

describe( 'Jetpack Settings updateJetpackSettings action', () => {
	const action = updateJetpackSettings( undefined, undefined );
	test( 'yield setJetpackSettings state to new one', () => {
		// Create notice 'Updating'.
		expect( action.next().value.type ).toEqual( 'CREATE_NOTICE' );
		// Set state updating flag.
		expect( action.next().value.type ).toEqual( 'SET_WORDADS_SETTINGS' );
		// Set state to the target state.
		expect( action.next().value.type ).toEqual( 'SET_WORDADS_SETTINGS' );
		// Post new settings to API.
		expect( action.next().value.type ).toEqual( 'UPDATE_WORDADS_SETTINGS' );
		// Fetch settings from API.
		expect( action.next().value.type ).toEqual( 'FETCH_WORDADS_SETTINGS' );
		// Set fetched setting from above step.
		expect( action.next().value.type ).toEqual( 'SET_WORDADS_SETTINGS' );
		// Remove 'Updating' notice.
		expect( action.next().value.type ).toEqual( 'REMOVE_NOTICE' );
		// Remove state updating flag.
		expect( action.next().value.type ).toEqual( 'SET_WORDADS_SETTINGS' );
		// Create success notice.
		expect( action.next().value.type ).toEqual( 'CREATE_NOTICE' );
	} );
} );
