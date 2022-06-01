import { useEffect, useState } from '@wordpress/element';
import { PINTEREST_EXAMPLE_URL } from '../';
import testEmbedUrl from '../../../shared/test-embed-url';

const useTestPinterestEmbedUrl = ( initialValue = '' ) => {
	const [ isFetching, setIsFetching ] = useState( false );
	const [ pinterestUrl, setPinterestUrl ] = useState( initialValue );
	const [ isError, setIsError ] = useState( false );

	useEffect( () => {
		if ( ! pinterestUrl || pinterestUrl === PINTEREST_EXAMPLE_URL ) {
			return;
		}
		setIsFetching( true );
		testEmbedUrl( pinterestUrl )
			.then( resolvedUrl => {
				setIsFetching( false );
				setPinterestUrl( resolvedUrl );
				setIsError( false );
			} )
			.catch( () => {
				setIsFetching( false );
				setPinterestUrl( pinterestUrl || undefined );
				setIsError( true );
			} );
	}, [ pinterestUrl ] );

	return { isFetching, pinterestUrl, hasTestUrlError: isError, testUrl: setPinterestUrl };
};

export default useTestPinterestEmbedUrl;
