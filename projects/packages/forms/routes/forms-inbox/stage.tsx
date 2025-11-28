/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { useSearch, useNavigate } from '@wordpress/route';

/**
 * Types for URL state and global interface.
 */
interface SearchParams {
	r?: string;
	status?: string;
	search?: string;
	[ key: string ]: unknown;
}

interface FormsState {
	status: string;
	selectedIds: string[];
	search: string;
}

interface JetpackForms {
	state: FormsState;
	navigate: ( params: Partial< SearchParams > ) => void;
	setInspectorResponse: ( response: unknown | null ) => void;
	inspectorResponse: unknown | null;
}

declare global {
	interface Window {
		jetpackFormsInit?: () => void;
		__jetpackForms?: JetpackForms;
	}
}

// Event name for state changes
const STATE_CHANGE_EVENT = 'jetpack-forms-state-change';

/**
 * Stage component for the forms inbox route.
 *
 * Manages URL state with @wordpress/route and exposes it to the
 * webpack-built dashboard via a simple global object.
 *
 * @return {JSX.Element} The stage component.
 */
export const stage = () => {
	const searchParams = useSearch( { strict: false } ) as SearchParams;
	const navigate = useNavigate();

	// Create a stable navigate function for the dashboard
	const updateSearchParams = useCallback(
		( params: Partial< SearchParams > ) => {
			navigate( {
				search: ( prev: SearchParams ) => ( {
					...prev,
					...params,
				} ),
				replace: true,
			} );
		},
		[ navigate ]
	);

	// Update global state on each render
	useEffect( () => {
		const state: FormsState = {
			status: ( searchParams?.status as string ) || 'inbox',
			selectedIds: searchParams?.r?.split( ',' ).filter( Boolean ) || [],
			search: ( searchParams?.search as string ) || '',
		};

		// Initialize or update the global
		if ( ! window.__jetpackForms ) {
			window.__jetpackForms = {
				state,
				navigate: updateSearchParams,
				inspectorResponse: null,
				setInspectorResponse( response ) {
					this.inspectorResponse = response;
					window.dispatchEvent( new CustomEvent( 'jetpack-forms-inspector-change' ) );
				},
			};
		} else {
			window.__jetpackForms.state = state;
			window.__jetpackForms.navigate = updateSearchParams;
		}

		// Dispatch event for reactivity
		window.dispatchEvent( new CustomEvent( STATE_CHANGE_EVENT ) );
	}, [ searchParams, updateSearchParams ] );

	// Initialize the Forms dashboard
	useEffect( () => {
		if ( typeof window.jetpackFormsInit === 'function' ) {
			window.jetpackFormsInit();
		}
	}, [] );

	return (
		<div
			id="jp-forms-dashboard"
			className="jp-forms-dashboard"
			style={ { height: '100%', width: '100%' } }
		/>
	);
};
