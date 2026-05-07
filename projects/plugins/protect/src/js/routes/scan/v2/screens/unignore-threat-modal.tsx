import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { useUnignoreThreatMutation } from '../data/use-threat-mutations';
import { useTrackEvent } from '../data/use-track-event';
import type { RenderModalProps } from './types';
import type { Threat } from '../data/types';

/**
 * Single-threat unignore-confirmation modal — wired into `ThreatsDataViews`'
 * row "Unignore" action via the `RenderUnignoreModal` prop. DataViews wraps
 * this content in its own `Modal` (with the "Unignore threat" header set by
 * the registering screen); this component renders only the body + action
 * buttons. Mirrors `packages/scan`'s `UnignoreThreatModal`: warn the user
 * that the threat will become active again, then fire the unignore mutation.
 * Single-step (no polling — unignore is synchronous on WPCOM's side).
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

	const handleUnignore = useCallback( () => {
		trackEvent( 'jetpack_protect_scan_unignore_threat_modal_click', { threat_id: threat.id } );
		unignoreMutation.mutate( threat.id, {
			onSuccess: () => {
				closeModal?.();
				createSuccessNotice( __( 'Threat unignored.', 'jetpack-protect' ), { type: 'snackbar' } );
			},
			onError: () => {
				closeModal?.();
				createErrorNotice( __( 'Could not unignore the threat.', 'jetpack-protect' ), {
					type: 'snackbar',
				} );
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
			<Text variant="muted">
				{ __( 'Jetpack will be unignoring the following threat:', 'jetpack-protect' ) }
			</Text>
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text weight={ 500 }>{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.description && <Text variant="muted">{ threat.description }</Text> }
			</Stack>
			<Notice.Root variant="warning">
				<Notice.Description>
					{ __(
						'By unignoring this threat you confirm that you have reviewed the detected code and assume the risks of treating a potentially malicious file as an active threat again.',
						'jetpack-protect'
					) }
				</Notice.Description>
			</Notice.Root>
			<Stack gap="sm" direction="row" justify="flex-end">
				<Button variant="outline" onClick={ closeModal } disabled={ unignoreMutation.isPending }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button
					variant="solid"
					onClick={ handleUnignore }
					loading={ unignoreMutation.isPending }
					disabled={ unignoreMutation.isPending }
				>
					{ __( 'Unignore threat', 'jetpack-protect' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

export default UnignoreThreatModal;
