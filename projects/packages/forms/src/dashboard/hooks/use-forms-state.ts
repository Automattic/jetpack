/**
 * External dependencies
 */
import { useSyncExternalStore, useCallback } from '@wordpress/element';

/**
 * Types for the forms state interface.
 */
interface FormsState {
	status: string;
	selectedIds: string[];
	search: string;
}

interface SearchParams {
	r?: string;
	status?: string;
	search?: string;
	[ key: string ]: unknown;
}

declare global {
	interface Window {
		__jetpackForms?: {
			state: FormsState;
			navigate: ( params: Partial< SearchParams > ) => void;
			setInspectorResponse: ( response: unknown | null ) => void;
			inspectorResponse: unknown | null;
		};
	}
}

const STATE_CHANGE_EVENT = 'jetpack-forms-state-change';
const INSPECTOR_CHANGE_EVENT = 'jetpack-forms-inspector-change';

const DEFAULT_STATE: FormsState = {
	status: 'inbox',
	selectedIds: [],
	search: '',
};

/**
 * Initialize the global forms state if not already present.
 * This provides a fallback for standalone mode (CIAB) where the
 * wp-build stage component doesn't run.
 */
function initializeFormsState(): void {
	if ( typeof window === 'undefined' || window.__jetpackForms ) {
		return;
	}

	// Create a standalone implementation for non-wp-build contexts
	window.__jetpackForms = {
		state: { ...DEFAULT_STATE },
		navigate( params ) {
			// In standalone mode, just update the local state
			this.state = {
				...this.state,
				status: params.status ?? this.state.status,
				selectedIds: params.r ? params.r.split( ',' ).filter( Boolean ) : [],
				search: params.search ?? this.state.search,
			};
			window.dispatchEvent( new CustomEvent( STATE_CHANGE_EVENT ) );
		},
		inspectorResponse: null,
		setInspectorResponse( response ) {
			this.inspectorResponse = response;
			window.dispatchEvent( new CustomEvent( INSPECTOR_CHANGE_EVENT ) );
		},
	};
}

// Initialize on module load
initializeFormsState();

/**
 * Subscribe to forms state changes using native CustomEvent.
 *
 * @param callback - Function to call when state changes.
 * @return Cleanup function.
 */
function subscribeToState( callback: () => void ): () => void {
	window.addEventListener( STATE_CHANGE_EVENT, callback );
	return () => window.removeEventListener( STATE_CHANGE_EVENT, callback );
}

/**
 * Get the current forms state snapshot.
 *
 * @return Current forms state.
 */
function getStateSnapshot(): FormsState {
	return window.__jetpackForms?.state ?? DEFAULT_STATE;
}

/**
 * Hook to get the current forms state from the URL.
 *
 * @return Current forms state.
 */
export function useFormsState(): FormsState {
	return useSyncExternalStore( subscribeToState, getStateSnapshot, () => DEFAULT_STATE );
}

/**
 * Hook to get the current status filter.
 *
 * @return Current status ('inbox' | 'spam' | 'trash').
 */
export function useStatus(): string {
	const state = useFormsState();
	return state.status;
}

/**
 * Hook to get the selected response IDs.
 *
 * @return Array of selected response IDs.
 */
export function useSelectedIds(): string[] {
	const state = useFormsState();
	return state.selectedIds;
}

/**
 * Hook to navigate/update URL params.
 *
 * @return Navigate function.
 */
export function useFormsNavigate(): ( params: Partial< SearchParams > ) => void {
	return useCallback( ( params: Partial< SearchParams > ) => {
		window.__jetpackForms?.navigate( params );
	}, [] );
}

/**
 * Hook to update selected responses in the URL.
 *
 * @return Function to update selection.
 */
export function useUpdateSelection(): ( ids: string[] ) => void {
	const navigate = useFormsNavigate();
	return useCallback(
		( ids: string[] ) => {
			navigate( { r: ids.length ? ids.join( ',' ) : undefined } );
		},
		[ navigate ]
	);
}

/**
 * Hook to update the status filter in the URL.
 *
 * @return Function to update status.
 */
export function useUpdateStatus(): ( status: string ) => void {
	const navigate = useFormsNavigate();
	return useCallback(
		( status: string ) => {
			navigate( { status, r: undefined } );
		},
		[ navigate ]
	);
}

/**
 * Subscribe to inspector changes.
 *
 * @param callback - Function to call when inspector changes.
 * @return Cleanup function.
 */
function subscribeToInspector( callback: () => void ): () => void {
	window.addEventListener( INSPECTOR_CHANGE_EVENT, callback );
	return () => window.removeEventListener( INSPECTOR_CHANGE_EVENT, callback );
}

/**
 * Get the current inspector response snapshot.
 *
 * @return Current inspector response.
 */
function getInspectorSnapshot(): unknown | null {
	return window.__jetpackForms?.inspectorResponse ?? null;
}

/**
 * Hook to get the current inspector response.
 *
 * @return Current inspector response.
 */
export function useInspectorResponse(): unknown | null {
	return useSyncExternalStore( subscribeToInspector, getInspectorSnapshot, () => null );
}

/**
 * Hook to set the inspector response.
 *
 * @return Function to set inspector response.
 */
export function useSetInspectorResponse(): ( response: unknown | null ) => void {
	return useCallback( ( response: unknown | null ) => {
		window.__jetpackForms?.setInspectorResponse( response );
	}, [] );
}
