import React, { useState } from 'react';
import { DataSyncProvider, useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, Button } from '@automattic/jetpack-components';
import {
	measureSuperCacheSaving,
	isSuperCachePluginActive,
	isSuperCacheEnabled,
} from './lib/utils/measure';
import { z } from 'zod';

const SuperCacheInfo = () => {
	const [ state, setState ] = useState( { status: 'idle' } ); // idle, testing, error, complete

	const { useQuery, useMutation } = useDataSync(
		'jetpack_boost_ds',
		'super_cache_notice_disabled',
		z.boolean()
	);
	const { data: isNoticeDismissed } = useQuery();
	const { mutate: setNoticeDismissed } = useMutation();

	const runTest = async () => {
		setState( { status: 'testing' } );
		try {
			const saving = await measureSuperCacheSaving();
			setState( { status: 'complete', saving } );
		} catch ( error ) {
			setState( { status: 'error', error } );
		}
	};

	const navToSuperCacheSettings = () => {
		window.location.href = './options-general.php?page=wpsupercache';
	};

	if ( isSuperCacheEnabled() ) {
		if ( state.status === 'testing' ) {
			return (
				<Notice
					level="info"
					title={ __( 'Measuring Super Cache Speed', 'jetpack-boost' ) }
					hideCloseButton={ true }
					actions={ [
						<Button key="running" isPrimary isLoading>
							{ __( 'Run test', 'jetpack-boost' ) }
						</Button>,
					] }
				>
					<p>{ __( 'Jetpack Boost is testing the speed of your cache.', 'jetpack-boost' ) }</p>
				</Notice>
			);
		} else if ( state.status === 'idle' ) {
			return (
				<Notice
					level="info"
					title={ __( 'Super Cache detected', 'jetpack-boost' ) }
					hideCloseButton={ true }
					actions={ [
						<Button
							key="start"
							isPrimary
							onClick={ () => {
								runTest();
							} }
						>
							{ __( 'Run test', 'jetpack-boost' ) }
						</Button>,
					] }
				>
					<p>{ __( 'Find out how much difference it makes for your users.', 'jetpack-boost' ) }</p>
				</Notice>
			);
		} else if ( state.status === 'complete' ) {
			return (
				<Notice
					level="success"
					title={ __( 'Super Cache Speed', 'jetpack-boost' ) }
					hideCloseButton={ true }
					actions={ [
						<Button
							key="start"
							isPrimary
							onClick={ () => {
								runTest();
							} }
						>
							{ __( 'Re-run test', 'jetpack-boost' ) }
						</Button>,
					] }
				>
					<p>
						{ sprintf(
							// translators: %d refers to the number of milliseconds users are saving by using Super Cache.
							__( 'Super Cache is saving your visitors about %d ms', 'jetpack-boost' ),
							state.saving
						) }
					</p>
				</Notice>
			);
		}
	} else {
		if ( isNoticeDismissed ) {
			return null;
		}

		if ( isSuperCachePluginActive() ) {
			return (
				<Notice
					level="warning"
					title={ __( 'Super Cache is installed but not enabled', 'jetpack-boost' ) }
					actions={ [
						<Button key="start" isPrimary onClick={ () => navToSuperCacheSettings() }>
							{ __( 'Set up', 'jetpack-boost' ) }
						</Button>,
					] }
					hideCloseButton={ false }
					onClose={ () => {
						setNoticeDismissed( true );
					} }
				>
					{ __( 'Enable Super Cache to speed your site up further.', 'jetpack-boost' ) }
				</Notice>
			);
		}
	}

	return null;
};

export default function () {
	return (
		<DataSyncProvider>
			<SuperCacheInfo />
		</DataSyncProvider>
	);
}
