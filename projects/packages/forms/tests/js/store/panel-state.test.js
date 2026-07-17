import { describe, expect, it } from '@jest/globals';
import { createRegistry } from '@wordpress/data';

const { store, PANEL_STATE_STORE, actions, selectors, reducer, DEFAULT_STATE } = await import(
	'../../../src/form-editor/store/panel-state'
);

const createRegistryWithStores = () => {
	const registry = createRegistry();
	registry.register( store );
	return registry;
};

describe( 'Panel State Store', () => {
	describe( 'DEFAULT_STATE', () => {
		it( 'should have activePanel set to null', () => {
			expect( DEFAULT_STATE.activePanel ).toBeNull();
		} );
	} );

	describe( 'actions', () => {
		it( 'openPanel should return OPEN_PANEL action with panel name', () => {
			const action = actions.openPanel( 'action-after-submit' );

			expect( action ).toEqual( {
				type: 'OPEN_PANEL',
				panelName: 'action-after-submit',
			} );
		} );

		it( 'openPanel should accept all valid panel names', () => {
			expect( actions.openPanel( 'form-notifications' ).panelName ).toBe( 'form-notifications' );
			expect( actions.openPanel( 'responses-storage' ).panelName ).toBe( 'responses-storage' );
			expect( actions.openPanel( null ).panelName ).toBeNull();
		} );

		it( 'closePanel should return CLOSE_PANEL action', () => {
			const action = actions.closePanel();

			expect( action ).toEqual( {
				type: 'CLOSE_PANEL',
			} );
		} );
	} );

	describe( 'selectors', () => {
		it( 'getActivePanel should return the active panel from state', () => {
			const state = { activePanel: 'form-notifications' };

			expect( selectors.getActivePanel( state ) ).toBe( 'form-notifications' );
		} );

		it( 'getActivePanel should return null when no panel is active', () => {
			const state = { activePanel: null };

			expect( selectors.getActivePanel( state ) ).toBeNull();
		} );
	} );

	describe( 'reducer', () => {
		it( 'should return default state when called with undefined state', () => {
			const action = { type: 'UNKNOWN_ACTION' };
			const state = reducer( undefined, action );

			expect( state ).toEqual( DEFAULT_STATE );
		} );

		it( 'should handle OPEN_PANEL action', () => {
			const action = actions.openPanel( 'action-after-submit' );
			const state = reducer( DEFAULT_STATE, action );

			expect( state.activePanel ).toBe( 'action-after-submit' );
		} );

		it( 'should handle OPEN_PANEL action when another panel is already open', () => {
			const initialState = { activePanel: 'form-notifications' };
			const action = actions.openPanel( 'responses-storage' );
			const state = reducer( initialState, action );

			expect( state.activePanel ).toBe( 'responses-storage' );
		} );

		it( 'should handle CLOSE_PANEL action', () => {
			const initialState = { activePanel: 'action-after-submit' };
			const action = actions.closePanel();
			const state = reducer( initialState, action );

			expect( state.activePanel ).toBeNull();
		} );

		it( 'should handle CLOSE_PANEL action when no panel is open', () => {
			const action = actions.closePanel();
			const state = reducer( DEFAULT_STATE, action );

			expect( state.activePanel ).toBeNull();
		} );

		it( 'should return unchanged state for unknown action', () => {
			const initialState = { activePanel: 'form-notifications' };
			const action = { type: 'UNKNOWN_ACTION' };
			const state = reducer( initialState, action );

			expect( state ).toBe( initialState );
		} );

		it( 'should not mutate the original state', () => {
			const initialState = { activePanel: null };
			const action = actions.openPanel( 'action-after-submit' );
			const newState = reducer( initialState, action );

			expect( newState ).not.toBe( initialState );
			expect( initialState.activePanel ).toBeNull();
		} );
	} );

	describe( 'store integration', () => {
		it( 'should have the correct store name', () => {
			expect( PANEL_STATE_STORE ).toBe( 'jetpack-forms/panel-state' );
		} );

		it( 'should work with registry dispatch and select', () => {
			const registry = createRegistryWithStores();

			// Initial state
			expect( registry.select( PANEL_STATE_STORE ).getActivePanel() ).toBeNull();

			// Open panel
			registry.dispatch( PANEL_STATE_STORE ).openPanel( 'action-after-submit' );
			expect( registry.select( PANEL_STATE_STORE ).getActivePanel() ).toBe( 'action-after-submit' );

			// Open different panel
			registry.dispatch( PANEL_STATE_STORE ).openPanel( 'form-notifications' );
			expect( registry.select( PANEL_STATE_STORE ).getActivePanel() ).toBe( 'form-notifications' );

			// Close panel
			registry.dispatch( PANEL_STATE_STORE ).closePanel();
			expect( registry.select( PANEL_STATE_STORE ).getActivePanel() ).toBeNull();
		} );
	} );
} );
