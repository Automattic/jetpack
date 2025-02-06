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
	WPContentNotWritableNotice,
} from './error-notices';
import SwitchToBoost from '../switch-to-boost/switch-to-boost';

type HealthProps = {
	error?: PageCacheError;
	cacheSetup: ReturnType< typeof usePageCacheSetup >[ 0 ];
	setError: ( error: PageCacheError ) => void;
};

const Health = ( { cacheSetup, error, setError }: HealthProps ) => {
	const [ , setModuleState ] = useSingleModuleState( 'page_cache', cacheIsActivated => {
		if ( cacheIsActivated ) {
			cacheSetup.mutate();
		}
	} );
	// Was there a problem trying to setup cache?
	const [ doingRevert, setDoingRevert ] = useState( false );

	useEffect( () => {
		if ( cacheSetup?.isError && error && ! error.dismissed ) {
			setDoingRevert( true );
		}
	}, [ cacheSetup?.isError, error, setDoingRevert ] );

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
		'wp-content-not-writable': <WPContentNotWritableNotice onClose={ onClose } />,
		'not-using-permalinks': <NotUsingPermalinksNotice onClose={ onClose } />,
		'advanced-cache-incompatible': <AdvancedCacheIncompatibleNotice onClose={ onClose } />,
		'advanced-cache-for-super-cache': (
			<AdvancedCacheForSuperCacheNotice
				actions={ [
					<SwitchToBoost key={ 'switch-to-boost' } onSwitch={ () => setModuleState( true ) } />,
				] }
				onClose={ onClose }
			/>
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
