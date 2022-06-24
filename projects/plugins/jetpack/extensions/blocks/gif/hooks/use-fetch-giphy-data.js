import { useEffect, useState } from '@wordpress/element';

const useFetchGiphyData = ( initialValue = [] ) => {
	const [ isFetching, setIsFetching ] = useState( false );
	const [ giphyData, setGiphyData ] = useState( initialValue );
	const [ fetchUrl, setFetchUrl ] = useState( '' );

	useEffect( () => {
		if ( ! fetchUrl ) {
			return;
		}

		const fetchResults = async () => {
			setIsFetching( true );

			const giphyFetch = await fetch( fetchUrl )
				.then( response => {
					if ( response.ok ) {
						return response;
					}
					return false;
				} )
				.catch( () => {
					return false;
				} );

			if ( giphyFetch ) {
				const giphyResponse = await giphyFetch.json();
				// If there is only one result, Giphy's API does not return an array.
				// The following statement normalizes the data into an array with one member in this case.
				const giphyResults =
					typeof giphyResponse.data.images !== 'undefined'
						? [ giphyResponse.data ]
						: giphyResponse.data;

				// Try to grab the first result. We're going to show this as the main image.
				const firstResult = giphyResults[ 0 ];

				// Check for results.
				if ( firstResult.images ) {
					setGiphyData( giphyResults );
				}
			}
			setIsFetching( false );
		};

		fetchResults();
	}, [ fetchUrl ] );

	return { isFetching, giphyData, fetchGiphyData: setFetchUrl };
};

export default useFetchGiphyData;
