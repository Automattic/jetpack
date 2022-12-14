/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

export default function useVideoItem( id ) {
	const [ item, setItem ] = useState( {} );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		async function fetchVideoItem() {
			try {
				const response = await apiFetch( {
					path: `/wp/v2/media/${ id }`,
				} );

				setItem( response?.jetpack_videopress || {} );
				setLoading( false );
			} catch ( error ) {
				setLoading( false );
				throw new Error( error );
			}
		}

		if ( id ) {
			setLoading( true );
			fetchVideoItem();
		}
	}, [ id ] );

	return [ item, loading ];
}
