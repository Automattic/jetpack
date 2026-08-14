/**
 * External dependencies
 */
import { Button, Stack } from '@jetpack-premium-analytics/externals';
import { useSyncStatus } from '@jetpack-premium-analytics/site-sync';
import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { Connection } from '../../../connect/images';
import styles from './section-sync-gate.module.scss';

/**
 * Sync progress, shown in place of a section's widgets until the analytics
 * initial full sync has finished once. Starts the sync when none is running,
 * and reloads once it completes so the section mounts with data.
 *
 * @return The sync gate.
 */
export function SectionSyncGate() {
	const { data, error, isLoading, isComplete, isStalled, triggerSync } = useSyncStatus();

	const [ isTriggering, setIsTriggering ] = useState( false );
	const didAutoTrigger = useRef( false );

	useEffect( () => {
		if ( data && ! data.isStarted && ! data.isRunning && ! didAutoTrigger.current ) {
			didAutoTrigger.current = true;
			void triggerSync();
		}
	}, [ data, triggerSync ] );

	const handleTriggerSync = useCallback( async () => {
		setIsTriggering( true );
		try {
			await triggerSync();
		} finally {
			setIsTriggering( false );
		}
	}, [ triggerSync ] );

	useEffect( () => {
		if ( isComplete ) {
			window.location.reload();
		}
	}, [ isComplete ] );

	if ( isComplete ) {
		return null;
	}

	const percentage = data?.percentage ?? 0;

	return (
		<Stack align="center" justify="center" className={ styles.root }>
			<Stack direction="column" gap="xl" align="center" className={ styles.gate }>
				<Connection />

				<Stack direction="column" gap="sm" align="center">
					<span className={ styles.title }>
						{ error
							? __( 'Sync interrupted', 'jetpack-premium-analytics-pkg' )
							: __( "We're preparing your data", 'jetpack-premium-analytics-pkg' ) }
					</span>

					<span className={ styles.description }>
						{ error
							? __(
									'Something went wrong while syncing your store data. Please try again.',
									'jetpack-premium-analytics-pkg'
							  )
							: __(
									'Your store data is being synced. This may take a few minutes depending on the size of your store.',
									'jetpack-premium-analytics-pkg'
							  ) }
					</span>
				</Stack>

				{ ! error && (
					<Stack direction="column" gap="sm" align="center" className={ styles.progress }>
						<ProgressBar value={ percentage } />
						{ ! isLoading && <span className={ styles.percentage }>{ percentage }%</span> }
					</Stack>
				) }

				{ ( error || isStalled ) && (
					<Button
						variant="solid"
						onClick={ handleTriggerSync }
						disabled={ isTriggering }
						loading={ isTriggering }
					>
						{ __( 'Try again', 'jetpack-premium-analytics-pkg' ) }
					</Button>
				) }
			</Stack>
		</Stack>
	);
}
