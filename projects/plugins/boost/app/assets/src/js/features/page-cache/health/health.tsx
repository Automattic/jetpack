import { Notice } from '@automattic/jetpack-components';
import getErrorData from './lib/get-error-data';
import { usePageCacheSetup, type PageCacheError } from '$lib/stores/page-cache';
import { useEffect, useState } from 'react';
import { useSingleModuleState } from '$features/module/lib/stores';
type HealthProps = {
	error?: PageCacheError;
	setup?: ReturnType< typeof usePageCacheSetup >;
	setError: ( error: PageCacheError ) => void;
};

const Health = ( { setup, error, setError }: HealthProps ) => {
	const [ , setPageCache ] = useSingleModuleState( 'page_cache' );
	// Was there a problem trying to setup cache?
	const errorData = getErrorData( error );
	const [ canReset, setCanReset ] = useState( false );

	useEffect( () => {
		if ( setup?.isError && error && ! error.dismissed ) {
			setCanReset( true );
		}
	}, [ setup?.isError, error, setCanReset ] );

	useEffect( () => {
		if ( canReset ) {
			setCanReset( false );
			setPageCache( false );
		}
	}, [ canReset, setCanReset, setPageCache ] );

	return (
		<>
			{ errorData && error && error.dismissed !== true && (
				<Notice
					level="warning"
					title={ errorData.title }
					onClose={ () => {
						setError( { ...error, dismissed: true } );
					} }
				>
					<p>{ errorData.message }</p>
				</Notice>
			) }
		</>
	);
};

export default Health;
