import { ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect } from 'react';
import { useIgnoreThreatMutation } from '../../data/use-threat-mutations';
import { useTrackEvent } from '../../data/use-track-event';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * Single-threat ignore-confirmation modal — wired into `ThreatsDataViews`'
 * row "Ignore" action via the `RenderIgnoreModal` prop. DataViews wraps
 * this content in its own `Modal`; this component renders only the
 * body + action buttons. Mirrors Calypso's `ignore-threat-modal.tsx`:
 * warn the user that ignoring leaves a potentially malicious file in
 * place, then fire the ignore mutation.
 *
 * @param props            - DataViews-supplied modal props.
 * @param props.items      - Selected threats. Single-threat row action, so always `[ threat ]`.
 * @param props.closeModal - Close-modal callback supplied by DataViews.
 * @return The modal body element.
 */
export function IgnoreThreatModal( {
	items,
	closeModal,
}: RenderModalProps< Threat > ): JSX.Element {
	const threat = items[ 0 ];
	const trackEvent = useTrackEvent();
	const ignoreMutation = useIgnoreThreatMutation();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	useEffect( () => {
		trackEvent( 'jetpack_scan_ignore_threat_modal_open' );
	}, [ trackEvent ] );

	const handleIgnore = useCallback( () => {
		trackEvent( 'jetpack_scan_ignore_threat_click' );
		ignoreMutation.mutate( threat.id, {
			onSuccess: () => {
				closeModal?.();
				trackEvent( 'jetpack_scan_ignore_threat_success' );
				createSuccessNotice( __( 'Threat ignored.', 'jetpack-scan-page' ), { type: 'snackbar' } );
			},
			onError: error => {
				closeModal?.();
				trackEvent( 'jetpack_scan_ignore_threat_failed' );
				createErrorNotice(
					error instanceof Error
						? error.message
						: __( 'Failed to ignore threat. Please try again.', 'jetpack-scan-page' ),
					{ type: 'snackbar' }
				);
			},
		} );
	}, [
		threat.id,
		ignoreMutation,
		closeModal,
		trackEvent,
		createSuccessNotice,
		createErrorNotice,
	] );

	return (
		<Stack gap="lg" direction="column">
			<Text className="jp-scan-text-muted">
				{ __( 'Jetpack will be ignoring the following threat:', 'jetpack-scan-page' ) }
			</Text>
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text variant="heading-md">{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.description && <Text className="jp-scan-text-muted">{ threat.description }</Text> }
			</Stack>
			<Notice.Root intent="error">
				<Notice.Description>
					{ __(
						'By ignoring this threat you confirm that you have reviewed the detected code and assume the risks of keeping a potentially malicious file on your site.',
						'jetpack-scan-page'
					) }
				</Notice.Description>
			</Notice.Root>
			<Stack gap="sm" direction="row" justify="flex-end">
				<Button variant="outline" onClick={ closeModal } disabled={ ignoreMutation.isPending }>
					{ __( 'Cancel', 'jetpack-scan-page' ) }
				</Button>
				<Button
					variant="solid"
					onClick={ handleIgnore }
					loading={ ignoreMutation.isPending }
					disabled={ ignoreMutation.isPending }
				>
					{ __( 'Ignore threat', 'jetpack-scan-page' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

export default IgnoreThreatModal;
