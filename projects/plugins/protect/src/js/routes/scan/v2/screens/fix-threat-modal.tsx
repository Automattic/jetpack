import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
import { isFixComplete, useFixThreatsStatusQuery } from '../data/use-fix-threats-status';
import { useFixThreatsMutation } from '../data/use-threat-mutations';
import { useTrackEvent } from '../data/use-track-event';
import type { RenderModalProps } from './types';
import type { Threat } from '../data/types';

/**
 * Single-threat fix-confirmation modal — wired into `ThreatsDataViews`'
 * row "Auto-fix" action via the `RenderFixModal` prop. DataViews wraps
 * this content in its own `Modal`; this component renders only the body
 * + action buttons. Mirrors `packages/scan`'s `FixThreatModal`: confirm
 * → kick the fix mutation → poll status → close with snackbar on
 * terminal state (success, fix-failure, or status-poll error).
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
		if ( ! pollingId ) {
			return;
		}
		if ( statusQuery.isError ) {
			closeModal?.();
			createErrorNotice( __( "We couldn't fix that threat.", 'jetpack-protect' ), {
				type: 'snackbar',
			} );
			return;
		}
		if ( ! isFixComplete( statusQuery.data ) ) {
			return;
		}
		const entry = statusQuery.data?.threats?.[ pollingId ];
		const success = entry?.status === 'fixed';
		closeModal?.();
		if ( success ) {
			createSuccessNotice( __( 'Threat fixed.', 'jetpack-protect' ), { type: 'snackbar' } );
		} else {
			createErrorNotice( __( "We couldn't fix that threat.", 'jetpack-protect' ), {
				type: 'snackbar',
			} );
		}
	}, [
		pollingId,
		statusQuery.data,
		statusQuery.isError,
		closeModal,
		createSuccessNotice,
		createErrorNotice,
	] );

	const handleFix = useCallback( async () => {
		trackEvent( 'jetpack_protect_scan_fix_threat_modal_click', { threat_id: threat.id } );
		try {
			await fixMutation.mutateAsync( [ threat.id ] );
			setPollingId( String( threat.id ) );
		} catch {
			closeModal?.();
			createErrorNotice( __( 'Could not start the fix.', 'jetpack-protect' ), {
				type: 'snackbar',
			} );
		}
	}, [ threat.id, fixMutation, closeModal, trackEvent, createErrorNotice ] );

	return (
		<Stack gap="lg" direction="column">
			<Text variant="muted">
				{ __( 'Jetpack will be fixing the following threat:', 'jetpack-protect' ) }
			</Text>
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text weight={ 500 }>{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.description && <Text variant="muted">{ threat.description }</Text> }
			</Stack>
			<Stack gap="sm" direction="row" justify="flex-end">
				<Button variant="outline" onClick={ closeModal } disabled={ isFixing }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button variant="solid" onClick={ handleFix } loading={ isFixing } disabled={ isFixing }>
					{ isFixing
						? __( 'Fixing threat…', 'jetpack-protect' )
						: __( 'Fix threat', 'jetpack-protect' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

export default FixThreatModal;
