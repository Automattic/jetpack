import { ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect } from 'react';
import { useUnignoreThreatMutation } from '../../data/use-threat-mutations';
import { useTrackEvent } from '../../data/use-track-event';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * Single-threat unignore-confirmation modal — wired into
 * `ThreatsDataViews`' row "Unignore" action via the `RenderUnignoreModal`
 * prop. DataViews wraps this content in its own `Modal`; this component
 * renders only the body + action buttons. Mirrors Calypso's
 * `unignore-threat-modal.tsx`: warn the user that the threat will become
 * active again, then fire the unignore mutation.
 *
 * @param props            - DataViews-supplied modal props.
 * @param props.items      - Selected threats. Single-threat row action, so always `[ threat ]`.
 * @param props.closeModal - Close-modal callback supplied by DataViews.
 * @return The modal body element.
 */
export function UnignoreThreatModal( {
	items,
	closeModal,
}: RenderModalProps< Threat > ): JSX.Element {
	const threat = items[ 0 ];
	const trackEvent = useTrackEvent();
	const unignoreMutation = useUnignoreThreatMutation();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	useEffect( () => {
		trackEvent( 'jetpack_scan_unignore_threat_modal_open' );
	}, [ trackEvent ] );

	const handleUnignore = useCallback( () => {
		trackEvent( 'jetpack_scan_unignore_threat_click' );
		unignoreMutation.mutate( threat.id, {
			onSuccess: () => {
				closeModal?.();
				trackEvent( 'jetpack_scan_unignore_threat_success' );
				createSuccessNotice( __( 'Threat unignored.', 'jetpack-scan-page' ), {
					type: 'snackbar',
				} );
			},
			onError: error => {
				closeModal?.();
				trackEvent( 'jetpack_scan_unignore_threat_failed' );
				createErrorNotice(
					error instanceof Error
						? error.message
						: __( 'Failed to unignore threat. Please try again.', 'jetpack-scan-page' ),
					{ type: 'snackbar' }
				);
			},
		} );
	}, [
		threat.id,
		unignoreMutation,
		closeModal,
		trackEvent,
		createSuccessNotice,
		createErrorNotice,
	] );

	return (
		<Stack gap="lg" direction="column">
			<Text className="jp-scan-text-muted">
				{ __( 'Jetpack will be unignoring the following threat:', 'jetpack-scan-page' ) }
			</Text>
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text variant="heading-md">{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.description && <Text className="jp-scan-text-muted">{ threat.description }</Text> }
			</Stack>
			<Notice.Root intent="warning">
				<Notice.Description>
					{ __(
						'By unignoring this threat you confirm that you have reviewed the detected code and assume the risks of treating a potentially malicious file as an active threat again.',
						'jetpack-scan-page'
					) }
				</Notice.Description>
			</Notice.Root>
			<Stack gap="sm" direction="row" justify="flex-end">
				<Button variant="outline" onClick={ closeModal } disabled={ unignoreMutation.isPending }>
					{ __( 'Cancel', 'jetpack-scan-page' ) }
				</Button>
				<Button
					variant="solid"
					onClick={ handleUnignore }
					loading={ unignoreMutation.isPending }
					disabled={ unignoreMutation.isPending }
				>
					{ __( 'Unignore threat', 'jetpack-scan-page' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

export default UnignoreThreatModal;
