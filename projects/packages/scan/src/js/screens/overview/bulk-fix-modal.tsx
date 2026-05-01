/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { type Threat } from '@automattic/jetpack-scan';
import {
	Button,
	Modal,
	Notice,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
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
			setStep( 'done' );
			createErrorNotice(
				error instanceof Error
					? error.message
					: __( 'Auto-fix failed. Please try again.', 'jetpack-scan-page' ),
				{ type: 'snackbar' }
			);
		}
	}, [ fixable.length, fixableIds, fixMutation, createErrorNotice, trackEvent ] );

	// Step transition once polling reports every threat is in a terminal state.
	useEffect( () => {
		if ( step !== 'progress' || ! isComplete ) {
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
	}, [ step, isComplete, polling, pollingIds, createSuccessNotice, trackEvent ] );

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
		<VStack spacing={ 4 }>
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
				<Notice status="info" isDismissible={ false }>
					{ __( 'Threats that cannot be auto-fixed will be skipped.', 'jetpack-scan-page' ) }
				</Notice>
			) }
			<ul style={ { margin: 0, paddingInlineStart: '20px' } }>
				{ fixable.map( threat => (
					<li key={ String( threat.id ) }>{ threat.title || threat.signature || threat.id }</li>
				) ) }
			</ul>
			<div style={ { display: 'flex', justifyContent: 'flex-end', gap: 8 } }>
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'jetpack-scan-page' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ onConfirm }
					disabled={ fixable.length === 0 }
					__next40pxDefaultSize
				>
					{ __( 'Auto-fix all', 'jetpack-scan-page' ) }
				</Button>
			</div>
		</VStack>
	);

	const renderProgress = () => (
		<VStack spacing={ 4 } alignment="center">
			<Text>
				{ __(
					'Hang tight — Jetpack is applying the fixes. This usually takes a few moments.',
					'jetpack-scan-page'
				) }
			</Text>
		</VStack>
	);

	const renderDone = () => {
		const entries = Object.entries( polling?.threats ?? {} );
		const fixedCount = entries.filter( ( [ , entry ] ) => entry.status === 'fixed' ).length;
		const totalCount = entries.length;

		return (
			<VStack spacing={ 4 }>
				<Text>
					{ sprintf(
						/* translators: %1$d is the number of threats fixed; %2$d is the total threats. */
						__( '%1$d of %2$d threats fixed.', 'jetpack-scan-page' ),
						fixedCount,
						totalCount
					) }
				</Text>
				<div style={ { display: 'flex', justifyContent: 'flex-end' } }>
					<Button variant="primary" onClick={ onClose } __next40pxDefaultSize>
						{ __( 'Done', 'jetpack-scan-page' ) }
					</Button>
				</div>
			</VStack>
		);
	};

	return (
		<Modal title={ title } onRequestClose={ onClose } shouldCloseOnEsc={ step !== 'progress' }>
			{ step === 'confirm' && renderConfirm() }
			{ step === 'progress' && renderProgress() }
			{ step === 'done' && renderDone() }
		</Modal>
	);
};

export default BulkFixModal;
