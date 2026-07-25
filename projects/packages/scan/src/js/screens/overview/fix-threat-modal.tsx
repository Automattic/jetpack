import { ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
import { isFixComplete, useFixThreatsStatusQuery } from '../../data/use-fix-threats-status';
import { useFixThreatsMutation } from '../../data/use-threat-mutations';
import { useTrackEvent } from '../../data/use-track-event';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * Single-threat fix-confirmation modal — wired into `ThreatsDataViews`'
 * row "Auto-fix" action via the `RenderFixModal` prop. DataViews wraps
 * this content in its own `Modal`; this component renders only the body
 * + action buttons. Mirrors Calypso's `fix-threat-modal.tsx`: confirm →
 * kick the fix mutation → poll status → close with snackbar on terminal
 * state.
 *
 * @param props            - DataViews-supplied modal props.
 * @param props.items      - Selected threats. Single-threat row action, so always `[ threat ]`.
 * @param props.closeModal - Close-modal callback supplied by DataViews.
 * @return The modal body element.
 */
export function FixThreatModal( { items, closeModal }: RenderModalProps< Threat > ): JSX.Element {
	const threat = items[ 0 ];
	const trackEvent = useTrackEvent();
	const fixMutation = useFixThreatsMutation();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const [ pollingId, setPollingId ] = useState< string | null >( null );
	const statusQuery = useFixThreatsStatusQuery( pollingId ? [ pollingId ] : null );
	const isFixing =
		fixMutation.isPending || ( pollingId !== null && ! isFixComplete( statusQuery.data ) );

	useEffect( () => {
		trackEvent( 'jetpack_scan_fix_threat_modal_open' );
	}, [ trackEvent ] );

	useEffect( () => {
		if ( ! pollingId ) {
			return;
		}
		if ( statusQuery.isError ) {
			closeModal?.();
			trackEvent( 'jetpack_scan_fix_threat_failed' );
			createErrorNotice(
				statusQuery.error instanceof Error
					? statusQuery.error.message
					: __( "Couldn't check fix status. Please refresh and try again.", 'jetpack-scan-page' ),
				{ type: 'snackbar' }
			);
			return;
		}
		if ( ! isFixComplete( statusQuery.data ) ) {
			return;
		}
		const entry = statusQuery.data?.threats?.[ pollingId ];
		const success = entry?.status === 'fixed';
		closeModal?.();
		if ( success ) {
			trackEvent( 'jetpack_scan_fix_threat_success' );
			createSuccessNotice( __( 'Threat fixed.', 'jetpack-scan-page' ), { type: 'snackbar' } );
		} else {
			trackEvent( 'jetpack_scan_fix_threat_failed' );
			createErrorNotice( __( 'Failed to fix threat. Please try again.', 'jetpack-scan-page' ), {
				type: 'snackbar',
			} );
		}
	}, [
		pollingId,
		statusQuery.data,
		statusQuery.isError,
		statusQuery.error,
		closeModal,
		trackEvent,
		createSuccessNotice,
		createErrorNotice,
	] );

	const handleFix = useCallback( async () => {
		trackEvent( 'jetpack_scan_fix_threat_click' );
		try {
			await fixMutation.mutateAsync( [ threat.id ] );
			setPollingId( String( threat.id ) );
		} catch ( error ) {
			closeModal?.();
			trackEvent( 'jetpack_scan_fix_threat_failed' );
			createErrorNotice(
				error instanceof Error
					? error.message
					: __( 'Failed to fix threat. Please try again.', 'jetpack-scan-page' ),
				{ type: 'snackbar' }
			);
		}
	}, [ threat.id, fixMutation, closeModal, trackEvent, createErrorNotice ] );

	return (
		<Stack gap="lg" direction="column">
			<Text className="jp-scan-text-muted">
				{ __( 'Jetpack will be fixing the following threat:', 'jetpack-scan-page' ) }
			</Text>
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text variant="heading-md">{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.description && <Text className="jp-scan-text-muted">{ threat.description }</Text> }
			</Stack>
			<Stack gap="sm" direction="row" justify="flex-end">
				<Button variant="outline" onClick={ closeModal } disabled={ isFixing }>
					{ __( 'Cancel', 'jetpack-scan-page' ) }
				</Button>
				<Button variant="solid" onClick={ handleFix } loading={ isFixing } disabled={ isFixing }>
					{ isFixing
						? __( 'Fixing threat…', 'jetpack-scan-page' )
						: __( 'Fix threat', 'jetpack-scan-page' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

export default FixThreatModal;
