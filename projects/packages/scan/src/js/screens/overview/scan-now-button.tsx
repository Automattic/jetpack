import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback } from 'react';
import { useEnqueueScanMutation } from '../../data/use-threat-mutations';
import { useTrackEvent } from '../../data/use-track-event';
import type { FC } from 'react';

interface ScanNowButtonProps {
	disabled?: boolean;
	variant?: 'primary' | 'secondary' | 'tertiary';
}

/**
 * Triggers a fresh scan run via `useEnqueueScanMutation`. Surfaces a
 * snackbar on settle so the user gets confirmation even when the scan
 * itself is asynchronous on WPCOM's side.
 *
 * @param root0          - Component props.
 * @param root0.disabled - Whether the button is disabled (e.g. while a scan is already running).
 * @param root0.variant  - Optional Button `variant` override; defaults to `secondary`.
 * @return The button element.
 */
const ScanNowButton: FC< ScanNowButtonProps > = ( { disabled = false, variant = 'secondary' } ) => {
	const enqueueMutation = useEnqueueScanMutation();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const trackEvent = useTrackEvent();

	const onClick = useCallback( async () => {
		trackEvent( 'jetpack_scan_scan_now' );
		try {
			await enqueueMutation.mutateAsync();
			createSuccessNotice( __( 'Scan started.', 'jetpack-scan-page' ), { type: 'snackbar' } );
		} catch ( error ) {
			createErrorNotice(
				error instanceof Error
					? error.message
					: __( 'Could not start the scan. Please try again.', 'jetpack-scan-page' ),
				{ type: 'snackbar' }
			);
		}
	}, [ enqueueMutation, createSuccessNotice, createErrorNotice, trackEvent ] );

	return (
		<Button
			variant={ variant }
			onClick={ onClick }
			disabled={ disabled || enqueueMutation.isPending }
			isBusy={ enqueueMutation.isPending }
			__next40pxDefaultSize
		>
			{ __( 'Scan now', 'jetpack-scan-page' ) }
		</Button>
	);
};

export default ScanNowButton;
