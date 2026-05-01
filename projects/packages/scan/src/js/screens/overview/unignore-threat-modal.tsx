/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import {
	Button,
	Notice,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useEffect } from 'react';
import { useUnignoreThreatMutation } from '../../data/use-threat-mutations';
import { useTrackEvent } from '../../data/use-track-event';
import type { RenderModalProps } from '@wordpress/dataviews';

/**
 * Single-threat unignore-confirmation modal — wired into
 * `ThreatsDataViews`' row "Unignore" action via the `RenderUnignoreModal`
 * prop. Mirrors Calypso's `unignore-threat-modal.tsx`: warn the user
 * that the threat will become active again, then fire the unignore
 * mutation.
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
		<VStack spacing={ 4 }>
			<Text variant="muted">
				{ __( 'Jetpack will be unignoring the following threat:', 'jetpack-scan-page' ) }
			</Text>
			<VStack spacing={ 1 }>
				<div style={ { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } }>
					<Text weight={ 500 }>{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</div>
				{ threat.description && <Text variant="muted">{ threat.description }</Text> }
			</VStack>
			<Notice status="warning" isDismissible={ false }>
				{ __(
					'By unignoring this threat you confirm that you have reviewed the detected code and assume the risks of treating a potentially malicious file as an active threat again.',
					'jetpack-scan-page'
				) }
			</Notice>
			<div style={ { display: 'flex', justifyContent: 'flex-end', gap: 8 } }>
				<Button variant="tertiary" onClick={ closeModal } disabled={ unignoreMutation.isPending }>
					{ __( 'Cancel', 'jetpack-scan-page' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ handleUnignore }
					isBusy={ unignoreMutation.isPending }
					disabled={ unignoreMutation.isPending }
					__next40pxDefaultSize
				>
					{ __( 'Unignore threat', 'jetpack-scan-page' ) }
				</Button>
			</div>
		</VStack>
	);
}

export default UnignoreThreatModal;
