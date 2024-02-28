import { Notice } from '@automattic/jetpack-components';
import getErrorData from './lib/get-error-data';
import { __ } from '@wordpress/i18n';
import { usePageCacheSetup, type PageCacheError } from '$lib/stores/page-cache';
import { MutationNotice } from '$features/ui';
import { useEffect } from 'react';
import { useSingleModuleState } from '$features/module/lib/stores';
type HealthProps = {
	error?: PageCacheError;
	setup?: ReturnType< typeof usePageCacheSetup >;
	setError: ( error: PageCacheError ) => void;
};

const Health = ( { setup, error, setError }: HealthProps ) => {
	const [ pageCache, setPageCache ] = useSingleModuleState( 'page_cache' );
	// Was there a problem trying to setup cache?
	const errorData = getErrorData( error );
	useEffect( () => {
		if ( setup?.isError && error && pageCache?.active ) {
			setPageCache( false );
		}
	}, [ setup?.isError, error, pageCache, setPageCache ] );
	return (
		<>
			{ setup && (
				<MutationNotice
					mutationId="page-cache-setup"
					isPending={
						setup.isPending || ( !! pageCache?.active && ( ! error || !! error.dismissed ) )
					}
					isError={ setup.isError }
					isSuccess={ setup.isSuccess && ! error }
					savingMessage={ __( 'Setting up cache…', 'jetpack-boost' ) }
					errorMessage={ __( 'An error occurred while setting up cache.', 'jetpack-boost' ) }
					successMessage={ __( 'Cache setup complete.', 'jetpack-boost' ) }
				/>
			) }
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
