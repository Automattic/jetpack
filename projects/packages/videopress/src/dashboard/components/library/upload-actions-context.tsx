import { createContext, useContext } from '@wordpress/element';

export type UploadActions = {
	promoteLocal: ( id: string ) => void;
	retryUpload: ( id: string ) => void;
	openVideoDetails: ( id: string ) => void;
};

const UploadActionsContext = createContext< UploadActions | null >( null );

export const UploadActionsProvider = UploadActionsContext.Provider;

/**
 * Read the upload-actions callbacks supplied by the Library Stage. Used by
 * `ThumbnailField` (and the title cell) so the per-card hover buttons, the
 * Retry overlay, and the click-to-open-details affordance can call the hook's
 * mutators without prop-drilling through DataViews's grid layout.
 *
 * @return The upload-action callbacks.
 */
export function useUploadActions(): UploadActions {
	const ctx = useContext( UploadActionsContext );
	if ( ! ctx ) {
		throw new Error( 'UploadActionsProvider missing in tree' );
	}
	return ctx;
}
