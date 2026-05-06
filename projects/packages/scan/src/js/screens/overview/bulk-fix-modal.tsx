import { type Threat } from '@automattic/jetpack-scan';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Dialog, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isFixComplete, useFixThreatsStatusQuery } from '../../data/use-fix-threats-status';
import { useFixThreatsMutation } from '../../data/use-threat-mutations';
import { useTrackEvent } from '../../data/use-track-event';
import type { FC } from 'react';

type ModalStep = 'confirm' | 'progress' | 'done';

interface BulkFixModalProps {
	threats: Threat[];
	onClose: () => void;
}

const fixableThreatsOf = ( threats: Threat[] ): Threat[] =>
	threats.filter( threat => !! threat.fixable );

/**
 * Bulk auto-fix modal — confirms the threats to fix, kicks
 * `useFixThreatsMutation`, then polls `useFixThreatsStatusQuery` every
 * 2 s until every threat reaches a terminal state. Mirrors the spirit
 * of Calypso's `bulk-fix-threats-modal` (issue #48456 phase 4): list →
 * confirm → progress → done summary.
 *
 * Uses `Dialog` from `@wordpress/ui` per the CIAB component-priority
 * guide (`@wordpress/ui` > `@automattic/design-system` > `@wordpress/components`).
 *
 * @param root0         - Component props.
 * @param root0.threats - Threats to attempt auto-fix on. Non-fixable entries are filtered before submitting.
 * @param root0.onClose - Close handler invoked when the modal should dismiss.
 * @return The modal element, or `null` when there's nothing fixable to act on.
 */
const BulkFixModal: FC< BulkFixModalProps > = ( { threats, onClose } ) => {
	const fixable = useMemo( () => fixableThreatsOf( threats ), [ threats ] );
	const fixableIds = useMemo( () => fixable.map( threat => String( threat.id ) ), [ fixable ] );

	const fixMutation = useFixThreatsMutation();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const trackEvent = useTrackEvent();

	const [ step, setStep ] = useState< ModalStep >( 'confirm' );
	const [ pollingIds, setPollingIds ] = useState< string[] | null >( null );

	const statusQuery = useFixThreatsStatusQuery( pollingIds );
	const polling = statusQuery.data;
	const isComplete = isFixComplete( polling );

	const onConfirm = useCallback( async () => {
		if ( fixable.length === 0 ) {
			return;
		}
		trackEvent( 'jetpack_scan_bulk_fix_threats_modal_click', { threat_count: fixable.length } );
		setStep( 'progress' );
		try {
			await fixMutation.mutateAsync( fixableIds );
			setPollingIds( fixableIds );
		} catch ( error ) {
			trackEvent( 'jetpack_scan_bulk_fix_threats_modal_failed', { threat_count: fixable.length } );
			onClose();
			createErrorNotice(
				error instanceof Error
					? error.message
					: __( 'Auto-fix failed. Please try again.', 'jetpack-scan-page' ),
				{ type: 'snackbar' }
			);
		}
	}, [ fixable.length, fixableIds, fixMutation, createErrorNotice, trackEvent, onClose ] );

	useEffect( () => {
		if ( step !== 'progress' ) {
			return;
		}
		if ( statusQuery.isError ) {
			trackEvent( 'jetpack_scan_bulk_fix_threats_modal_failed', {
				threat_count: pollingIds?.length ?? 0,
			} );
			onClose();
			createErrorNotice(
				statusQuery.error instanceof Error
					? statusQuery.error.message
					: __( "Couldn't check fix status. Please refresh and try again.", 'jetpack-scan-page' ),
				{ type: 'snackbar' }
			);
			return;
		}
		if ( ! isComplete ) {
			return;
		}
		setStep( 'done' );
		const fixedCount = Object.values( polling?.threats ?? {} ).filter(
			entry => entry.status === 'fixed'
		).length;
		const totalCount = pollingIds?.length ?? 0;
		const failedCount = totalCount - fixedCount;
		trackEvent( 'jetpack_scan_bulk_fix_threats_modal_success', {
			threat_count: totalCount,
			fixed_count: fixedCount,
			failed_count: failedCount,
		} );
		createSuccessNotice(
			sprintf(
				/* translators: %1$d is the number of threats fixed; %2$d is the number that couldn't be fixed. */
				_n(
					'Auto-fix finished: %1$d fixed, %2$d not fixed.',
					'Auto-fix finished: %1$d fixed, %2$d not fixed.',
					pollingIds?.length ?? 0,
					'jetpack-scan-page'
				),
				fixedCount,
				failedCount
			),
			{ type: 'snackbar' }
		);
	}, [
		step,
		isComplete,
		statusQuery.isError,
		statusQuery.error,
		polling,
		pollingIds,
		createSuccessNotice,
		createErrorNotice,
		trackEvent,
		onClose,
	] );

	const title = useMemo( () => {
		if ( step === 'progress' ) {
			return __( 'Fixing threats…', 'jetpack-scan-page' );
		}
		if ( step === 'done' ) {
			return __( 'Auto-fix complete', 'jetpack-scan-page' );
		}
		return __( 'Auto-fix threats', 'jetpack-scan-page' );
	}, [ step ] );

	const renderConfirm = () => (
		<Stack gap="lg" direction="column">
			<Text>
				{ sprintf(
					/* translators: %d is the number of threats Jetpack Scan can auto-fix. */
					_n(
						'Jetpack Scan can auto-fix %d threat. Continue?',
						'Jetpack Scan can auto-fix %d threats. Continue?',
						fixable.length,
						'jetpack-scan-page'
					),
					fixable.length
				) }
			</Text>
			{ fixable.length < threats.length && (
				<Notice.Root intent="info">
					<Notice.Description>
						{ __( 'Threats that cannot be auto-fixed will be skipped.', 'jetpack-scan-page' ) }
					</Notice.Description>
				</Notice.Root>
			) }
			<ul style={ { margin: 0, paddingInlineStart: '20px' } }>
				{ fixable.map( threat => (
					<li key={ String( threat.id ) }>{ threat.title || threat.signature || threat.id }</li>
				) ) }
			</ul>
			<Dialog.Footer>
				<Button variant="outline" onClick={ onClose }>
					{ __( 'Cancel', 'jetpack-scan-page' ) }
				</Button>
				<Button variant="solid" onClick={ onConfirm } disabled={ fixable.length === 0 }>
					{ __( 'Auto-fix all', 'jetpack-scan-page' ) }
				</Button>
			</Dialog.Footer>
		</Stack>
	);

	const renderProgress = () => (
		<Stack gap="lg" direction="column" align="center">
			<Text>
				{ __(
					'Hang tight — Jetpack is applying the fixes. This usually takes a few moments.',
					'jetpack-scan-page'
				) }
			</Text>
		</Stack>
	);

	const renderDone = () => {
		const entries = Object.entries( polling?.threats ?? {} );
		const fixedCount = entries.filter( ( [ , entry ] ) => entry.status === 'fixed' ).length;
		const totalCount = entries.length;

		return (
			<Stack gap="lg" direction="column">
				<Text>
					{ sprintf(
						/* translators: %1$d is the number of threats fixed; %2$d is the total threats. */
						__( '%1$d of %2$d threats fixed.', 'jetpack-scan-page' ),
						fixedCount,
						totalCount
					) }
				</Text>
				<Dialog.Footer>
					<Button variant="solid" onClick={ onClose }>
						{ __( 'Done', 'jetpack-scan-page' ) }
					</Button>
				</Dialog.Footer>
			</Stack>
		);
	};

	// `Dialog.Root`'s `onOpenChange` fires for both successful close and
	// outside-dismiss attempts. While the fixer is mid-poll we don't want
	// to allow the user to close the modal and walk away from the
	// in-flight request, so we only forward the close to the parent when
	// the step is not `progress` — mirrors the previous `Modal`'s
	// `shouldCloseOnEsc={ step !== 'progress' }`.
	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open && step !== 'progress' ) {
				onClose();
			}
		},
		[ step, onClose ]
	);

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange } modal>
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
					{ step !== 'progress' && <Dialog.CloseIcon /> }
				</Dialog.Header>
				{ step === 'confirm' && renderConfirm() }
				{ step === 'progress' && renderProgress() }
				{ step === 'done' && renderDone() }
			</Dialog.Popup>
		</Dialog.Root>
	);
};

export default BulkFixModal;
