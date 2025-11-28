/**
 * WordPress dependencies
 */
import { useSyncExternalStore, useLayoutEffect, useRef } from '@wordpress/element';

// Define the response type for the inspector
interface FormResponse {
	id: number;
	author_name?: string;
	author_email?: string;
	date?: string;
	[ key: string ]: unknown;
}

const INSPECTOR_CHANGE_EVENT = 'jetpack-forms-inspector-change';

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
function getInspectorSnapshot(): FormResponse | null {
	return ( window.__jetpackForms?.inspectorResponse as FormResponse | null ) ?? null;
}

/**
 * Hook to subscribe to the global inspector state.
 */
function useInspectorResponse(): FormResponse | null {
	return useSyncExternalStore( subscribeToInspector, getInspectorSnapshot, () => null );
}

/**
 * Inspector component for the forms inbox route.
 *
 * Displays the selected response details. Subscribes to the global inspector
 * state which is updated by the Forms dashboard when a response is selected.
 *
 * @return {JSX.Element} The inspector component.
 */
export const inspector = () => {
	const response = useInspectorResponse();
	const containerRef = useRef< HTMLDivElement >( null );

	// Hide/show the inspector surface wrapper based on whether we have a response
	useLayoutEffect( () => {
		const surface = containerRef.current?.closest( '.boot-layout__inspector' );
		if ( surface instanceof HTMLElement ) {
			surface.style.display = response ? '' : 'none';
		}
	}, [ response ] );

	// Always render the container so we can access the parent surface
	// The useLayoutEffect above will hide it when there's no response
	if ( ! response ) {
		return <div ref={ containerRef } style={ { display: 'none' } } />;
	}

	// Render a container for the response details
	// The dashboard will portal content here when it detects this container
	return (
		<div
			ref={ containerRef }
			id="jp-forms-inspector"
			className="jp-forms-inspector"
			style={ { height: '100%', overflow: 'auto' } }
		/>
	);
};
