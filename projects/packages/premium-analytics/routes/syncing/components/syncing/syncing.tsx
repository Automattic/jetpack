/**
 * External dependencies
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Stack, Button } from '@wordpress/ui';
import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSyncStatus } from '@jetpack-premium-analytics/site-sync';

/**
 * Internal dependencies
 */
import { Connection } from '../../../connect/images';
import './style.scss';

export function Syncing() {
	const { data, error, isLoading, isComplete, isStalled, triggerSync } =
		useSyncStatus();

	const [ isTriggering, setIsTriggering ] = useState( false );
	const didAutoTrigger = useRef( false );

	// Auto-trigger sync when it hasn't started yet.
	useEffect( () => {
		if (
			data &&
			! data.isStarted &&
			! data.isRunning &&
			! didAutoTrigger.current
		) {
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

	const title = error
		? __( 'Sync interrupted', 'jetpack-premium-analytics' )
		: __( "We're preparing your data", 'jetpack-premium-analytics' );

	const description = error
		? __(
				'Something went wrong while syncing your store data. Please try again.',
				'jetpack-premium-analytics'
		  )
		: __(
				'Your store data is being synced. This may take a few minutes depending on the size of your store.',
				'jetpack-premium-analytics'
		  );

	const percentage = data?.percentage ?? 0;

	return (
		<Stack
			direction="column"
			gap="xl"
			align="center"
			className="jetpack-premium-analytics-syncing"
		>
			<Connection />

			<Stack direction="column" gap="sm" align="center">
				<span className="jetpack-premium-analytics-syncing__title">{ title }</span>

				<span className="jetpack-premium-analytics-syncing__description">
					{ description }
				</span>
			</Stack>

			{ ! error && (
				<Stack
					direction="column"
					gap="sm"
					align="center"
					className="jetpack-premium-analytics-syncing__progress"
				>
					<ProgressBar value={ percentage } />
					{ ! isLoading && (
						<span className="jetpack-premium-analytics-syncing__percentage">
							{ percentage }%
						</span>
					) }
				</Stack>
			) }

			{ ( error || isStalled ) && (
				<Button
					variant="solid"
					onClick={ handleTriggerSync }
					disabled={ isTriggering }
					loading={ isTriggering }
				>
					{ __( 'Try again', 'jetpack-premium-analytics' ) }
				</Button>
			) }
		</Stack>
	);
}
