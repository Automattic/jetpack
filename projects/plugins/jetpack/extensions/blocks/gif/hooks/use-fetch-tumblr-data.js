import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

const useFetchTumblrData = ( initialValue = [] ) => {
	const [ isFetching, setIsFetching ] = useState( false );
	const [ tumblrData, setTumblrData ] = useState( initialValue );
	const [ fetchUrl, setFetchUrl ] = useState( '' );

	useEffect( () => {
		if ( ! fetchUrl ) {
			return;
		}

		const fetchResults = async () => {
			setIsFetching( true );

			try {
				const jsonResponse = await apiFetch( { path: fetchUrl } );
				const gifs = jsonResponse.response.gifs || [];

				setTumblrData( gifs );
			} catch ( error ) {
				// console.error( 'Error fetching data:', error );
			} finally {
				setIsFetching( false );
			}
		};

		fetchResults();
	}, [ fetchUrl ] );

	return { isFetching, tumblrData, fetchTumblrData: setFetchUrl };
};

export default useFetchTumblrData;
