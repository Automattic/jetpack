import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
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
				const jsonResponse = await apiFetch( { path: fetchUrl, global: true } );
				const gifs = jsonResponse.response.gifs || [];

				setTumblrData( gifs );
			} catch ( error ) {
				dispatch( noticesStore ).createErrorNotice(
					__( 'There was an error searching for GIFs. Please try again later.', 'jetpack' ),
					{
						type: 'snackbar',
						explicitDismiss: true,
					}
				);
			} finally {
				setIsFetching( false ); // Ensure this is called in both success and error cases
			}
		};

		fetchResults();
	}, [ fetchUrl ] );

	return { isFetching, tumblrData, fetchTumblrData: setFetchUrl };
};

export default useFetchTumblrData;
