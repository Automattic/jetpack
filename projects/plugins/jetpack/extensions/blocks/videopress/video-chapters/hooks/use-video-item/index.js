/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '../../utils';

const MEDIA_ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/videos/';

export default function useVideoItem( guid ) {
	const [ item, setItem ] = useState( {} );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		async function fetchVideoItem() {
			try {
				setLoading( false );
				const response = await fetch( `${ MEDIA_ENDPOINT }${ guid }` );
				const data = await response.json();
				setItem( {
					...data,
					title: decodeEntities( data?.title ),
					description: decodeEntities( data?.description ),
				} );
			} catch ( error ) {
				setLoading( false );
			}
		}

		if ( guid ) {
			setLoading( true );
			fetchVideoItem();
		}
	}, [ guid ] );

	return [ item, loading ];
}
