import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { useIgnoreThreatMutation } from '../data/use-threat-mutations';
import { useTrackEvent } from '../data/use-track-event';
import type { RenderModalProps } from './types';
import type { Threat } from '../data/types';

/**
 * Single-threat ignore-confirmation modal — wired into `ThreatsDataViews`'
 * row "Ignore" action via the `RenderIgnoreModal` prop. DataViews wraps
 * this content in its own `Modal`; this component renders only the
 * body + action buttons. Mirrors `packages/scan`'s `IgnoreThreatModal`:
 * warn the user that ignoring leaves a potentially malicious file in
 * place, then fire the ignore mutation. Single-step (no polling — ignore
 * is synchronous on WPCOM's side).
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

	const handleIgnore = useCallback( () => {
		trackEvent( 'jetpack_protect_scan_ignore_threat_modal_click', { threat_id: threat.id } );
		ignoreMutation.mutate( threat.id, {
			onSuccess: () => {
				closeModal?.();
				createSuccessNotice( __( 'Threat ignored.', 'jetpack-protect' ), { type: 'snackbar' } );
			},
			onError: () => {
				closeModal?.();
				createErrorNotice( __( 'Could not ignore the threat.', 'jetpack-protect' ), {
					type: 'snackbar',
				} );
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
			<Text variant="muted">
				{ __( 'Jetpack will be ignoring the following threat:', 'jetpack-protect' ) }
			</Text>
			<Stack gap="xs" direction="column">
				<Stack gap="sm" direction="row" align="center" wrap="wrap">
					<Text weight={ 500 }>{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</Stack>
				{ threat.description && <Text variant="muted">{ threat.description }</Text> }
			</Stack>
			<Notice.Root variant="error">
				<Notice.Description>
					{ __(
						'By ignoring this threat you confirm that you have reviewed the detected code and assume the risks of keeping a potentially malicious file on your site.',
						'jetpack-protect'
					) }
				</Notice.Description>
			</Notice.Root>
			<Stack gap="sm" direction="row" justify="flex-end">
				<Button variant="outline" onClick={ closeModal } disabled={ ignoreMutation.isPending }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button
					variant="solid"
					onClick={ handleIgnore }
					loading={ ignoreMutation.isPending }
					disabled={ ignoreMutation.isPending }
				>
					{ __( 'Ignore threat', 'jetpack-protect' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

export default IgnoreThreatModal;
