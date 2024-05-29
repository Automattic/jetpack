import Module from '$features/module/module';
import PageCacheMeta from '$features/page-cache/meta/meta';
import Health from '$features/page-cache/health/health';
import { ReactNode, useEffect, useState } from 'react';
import { useMutationNotice } from '$features/ui';
import { useShowCacheEngineErrorNotice } from './lib/stores';
import { usePageCacheError, usePageCacheSetup } from '$lib/stores/page-cache';
import { Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useSingleModuleState } from '$features/module/lib/stores';
import styles from './page-cache.module.scss';

const DismissableNotice = ( { title, children }: { title: string; children: ReactNode } ) => {
	const [ dismissed, setDismissed ] = useState( false );

	if ( dismissed ) {
		return null;
	}

	return (
		<div className={ styles.notice }>
			<Notice level="info" title={ title } onClose={ () => setDismissed( true ) }>
				{ children }
			</Notice>
		</div>
	);
};

const PageCache = () => {
	const [ moduleState ] = useSingleModuleState( 'page_cache' );
	const [ pageCacheSetup, pageCacheSetupNotices ] = usePageCacheSetup();
	const [ pageCacheError, pageCacheErrorMutation ] = usePageCacheError();
	const [ isPageCacheSettingUp, setIsPageCacheSettingUp ] = useState( false );
	const [ runningFreshSetup, setRunningFreshSetup ] = useState( false );
	const showCacheEngineErrorNotice = useShowCacheEngineErrorNotice(
		pageCacheSetup.isSuccess && !! moduleState?.active
	);

	const { site } = Jetpack_Boost;

	const [ removePageCacheNotice ] = useMutationNotice(
		'page-cache-setup',
		{
			...pageCacheSetup,

			/*
			 * We run page cache setup on both onMountEnabled and onEnable.
			 * However, the mutation notice should only show when the user is responsible for the action.
			 * So, we only show the notice if `runningFreshSetup`, unless it's an error.
			 */
			isSuccess: runningFreshSetup && pageCacheSetup.isSuccess,
			isPending: runningFreshSetup && ( isPageCacheSettingUp || pageCacheSetup.isPending ),
			isIdle: runningFreshSetup && pageCacheSetup.isIdle,
		},
		{
			savingMessage: __( 'Setting up cache…', 'jetpack-boost' ),
			errorMessage: __( 'An error occurred while setting up cache.', 'jetpack-boost' ),
			successMessage: __( 'Cache setup complete.', 'jetpack-boost' ),
		}
	);

	useEffect( () => {
		if ( pageCacheSetup.isPending ) {
			setIsPageCacheSettingUp( false );
		}
	}, [ pageCacheSetup.isPending ] );

	return (
		<Module
			slug="page_cache"
			title={ __( 'Cache Site Pages', 'jetpack-boost' ) }
			onBeforeToggle={ status => {
				setIsPageCacheSettingUp( status );
				if ( status === false ) {
					removePageCacheNotice();
					pageCacheSetup.reset();
				}
				if ( pageCacheError.data && pageCacheError.data.dismissed !== true ) {
					pageCacheErrorMutation.mutate( {
						...pageCacheError.data,
						dismissed: true,
					} );
				}
			} }
			onMountEnable={ () => {
				pageCacheSetup.mutate();
			} }
			onEnable={ () => {
				setRunningFreshSetup( true );
				pageCacheSetup.mutate();
			} }
			description={
				<>
					<p>
						{ __(
							'Store and serve preloaded content to reduce load times and enhance your site performance and user experience.',
							'jetpack-boost'
						) }
					</p>
					{ site.isAtomic && (
						<Notice
							level="warning"
							title={ __( 'Page Cache is unavailable', 'jetpack-boost' ) }
							hideCloseButton={ true }
						>
							<p>
								{ __(
									'Your website already has a page cache running on it powered by WordPress.com.',
									'jetpack-boost'
								) }
							</p>
						</Notice>
					) }
					<Health
						error={ pageCacheError.data }
						setError={ pageCacheErrorMutation.mutate }
						cacheSetup={ pageCacheSetup }
					/>
				</>
			}
		>
			{ showCacheEngineErrorNotice && (
				<Notice
					level="warning"
					title={ __( 'Page Cache is not working', 'jetpack-boost' ) }
					hideCloseButton={ true }
				>
					<p>
						{ __(
							'It appears that the cache engine is not loading. Please try re-installing Jetpack Boost. If the issue persists, please contact support.',
							'jetpack-boost'
						) }
					</p>
				</Notice>
			) }
			{ ! showCacheEngineErrorNotice && ! pageCacheError.data && ! pageCacheSetup.isError && (
				<>
					<PageCacheMeta />

					{ pageCacheSetup.isSuccess &&
						pageCacheSetupNotices.map( ( { title, message }, index ) => (
							<DismissableNotice title={ title } key={ index }>
								{ message }
							</DismissableNotice>
						) ) }
				</>
			) }
		</Module>
	);
};

export default PageCache;
