/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';

export default function useMediaItemUpdate( id ) {
	const updateMediaItem = data => {
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: { id, ...data },
			} )
				.then( result => {
					if ( 200 !== result?.data ) {
						return reject( result );
					}
					resolve( result );
				} )
				.catch( reject );
		} );
	};

	return updateMediaItem;
}

export function useSyncMedia( { id, title, description } ) {
	const isSaving = useSelect( select => select( 'core/editor' ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );

	const [ initialState, setState ] = useState();

	const updateData = useCallback( data => {
		setState( current => ( { ...current, ...data } ) );
	}, [] );

	// Populate initial state when mounted
	useEffect( () => {
		setState( { title, description } );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const updateMedia = useMediaItemUpdate( id );

	useEffect( () => {
		if ( ! isSaving || wasSaving ) {
			return;
		}

		if ( ! id ) {
			return;
		}

		const dataToUpdate = {};

		if ( initialState?.title !== title ) {
			dataToUpdate.title = title;
		}

		if ( initialState?.description !== description ) {
			dataToUpdate.description = description;
		}

		if ( ! Object.keys( dataToUpdate ).length ) {
			return;
		}

		updateMedia( dataToUpdate );
	}, [
		id,
		isSaving,
		wasSaving,
		title,
		initialState?.title,
		initialState?.description,
		description,
		updateMedia,
	] );

	return [ updateData ];
}
