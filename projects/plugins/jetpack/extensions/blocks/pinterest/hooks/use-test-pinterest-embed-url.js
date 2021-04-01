/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import testEmbedUrl from '../../../shared/test-embed-url';

const useTestPinterestEmbedUrl = ( initialValue = '' ) => {
	const [ isFetching, setIsFetching ] = useState( false );
	const [ pinterestUrl, setPinterestUrl ] = useState( initialValue );

	useEffect( () => {
		if ( ! pinterestUrl ) {
			return;
		}

		const fetchResults = async () => {
			setIsFetching( true );
			const results = await testEmbedUrl( pinterestUrl );
			if ( results ) {
				setPinterestUrl( results );
			} else {
				setPinterestUrl( undefined );
			}
			setIsFetching( false );
		};

		fetchResults();
	}, [ pinterestUrl ] );

	return { isFetching, pinterestUrl, testUrl: setPinterestUrl };
};

export default useTestPinterestEmbedUrl;
