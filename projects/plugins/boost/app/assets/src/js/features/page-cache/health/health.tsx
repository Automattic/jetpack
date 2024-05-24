import { usePageCacheSetup, type PageCacheError } from '$lib/stores/page-cache';
import { ReactNode, useEffect, useState } from 'react';
import { useSingleModuleState } from '$features/module/lib/stores';
import {
	AdvancedCacheForSuperCacheNotice,
	AdvancedCacheIncompatibleNotice,
	FailedSettingsWriteNotice,
	GenericErrorNotice,
	NotUsingPermalinksNotice,
	PageCacheRootDirNotWritableNotice,
	UnableToWriteToAdvancedCacheNotice,
	WPCacheDefinedNotTrueNotice,
	WPConfigNotWritableNotice,
	WpContentNotWritableNotice,
} from './error-notices';

type HealthProps = {
	error?: PageCacheError;
	setup: ReturnType< typeof usePageCacheSetup >;
	setError: ( error: PageCacheError ) => void;
};

const Health = ( { setup, error, setError }: HealthProps ) => {
	const [ , setModuleState ] = useSingleModuleState( 'page_cache' );
	// Was there a problem trying to setup cache?
	const [ doingRevert, setDoingRevert ] = useState( false );

	useEffect( () => {
		if ( setup?.isError && error && ! error.dismissed ) {
			setDoingRevert( true );
		}
	}, [ setup?.isError, error, setDoingRevert ] );

	useEffect( () => {
		if ( doingRevert ) {
			setModuleState( false );
			setDoingRevert( false );
		}
	}, [ doingRevert, setDoingRevert, setModuleState ] );

	if ( ! error || error.dismissed ) {
		return null;
	}

	const onClose = () => {
		setError( { ...error, dismissed: true } );
	};

	const code = typeof error === 'string' ? error : error.code;
	const notices: { [ key: string ]: ReactNode } = {
		'failed-settings-write': <FailedSettingsWriteNotice onClose={ onClose } />,
		'wp-content-not-writable': <WpContentNotWritableNotice onClose={ onClose } />,
		'not-using-permalinks': <NotUsingPermalinksNotice onClose={ onClose } />,
		'advanced-cache-incompatible': <AdvancedCacheIncompatibleNotice onClose={ onClose } />,
		'advanced-cache-for-super-cache': (
			<AdvancedCacheForSuperCacheNotice pageCacheSetup={ setup } onClose={ onClose } />
		),
		'unable-to-write-to-advanced-cache': <UnableToWriteToAdvancedCacheNotice onClose={ onClose } />,
		'wp-cache-defined-not-true': <WPCacheDefinedNotTrueNotice onClose={ onClose } />,
		'page-cache-root-dir-not-writable': <PageCacheRootDirNotWritableNotice onClose={ onClose } />,
		'wp-config-not-writable': <WPConfigNotWritableNotice onClose={ onClose } />,
	};

	if ( code in notices ) {
		return notices[ code ];
	}

	return <GenericErrorNotice error={ error } onClose={ onClose } />;
};

export default Health;
