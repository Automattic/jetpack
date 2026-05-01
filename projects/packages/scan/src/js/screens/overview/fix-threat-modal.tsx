/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import {
	Button,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useEffect, useState } from 'react';
import { isFixComplete, useFixThreatsStatusQuery } from '../../data/use-fix-threats-status';
import { useFixThreatsMutation } from '../../data/use-threat-mutations';
import { useTrackEvent } from '../../data/use-track-event';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * Single-threat fix-confirmation modal — wired into `ThreatsDataViews`'
 * row "Auto-fix" action via the `RenderFixModal` prop. Mirrors Calypso's
 * `fix-threat-modal.tsx`: confirm → kick the fix mutation → poll status
 * → close with snackbar on terminal state.
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
		if ( ! pollingId || ! isFixComplete( statusQuery.data ) ) {
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
		<VStack spacing={ 4 }>
			<Text variant="muted">
				{ __( 'Jetpack will be fixing the following threat:', 'jetpack-scan-page' ) }
			</Text>
			<VStack spacing={ 1 }>
				<div style={ { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } }>
					<Text weight={ 500 }>{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</div>
				{ threat.description && <Text variant="muted">{ threat.description }</Text> }
			</VStack>
			<div style={ { display: 'flex', justifyContent: 'flex-end', gap: 8 } }>
				<Button variant="tertiary" onClick={ closeModal } disabled={ isFixing }>
					{ __( 'Cancel', 'jetpack-scan-page' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ handleFix }
					isBusy={ isFixing }
					disabled={ isFixing }
					__next40pxDefaultSize
				>
					{ isFixing
						? __( 'Fixing threat…', 'jetpack-scan-page' )
						: __( 'Fix threat', 'jetpack-scan-page' ) }
				</Button>
			</div>
		</VStack>
	);
}

export default FixThreatModal;
