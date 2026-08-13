import { ProgressBar } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, close } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { Button, IconButton, Text, VisuallyHidden } from '@wordpress/ui';
import { useUpload } from '../../hooks/use-upload';
import './style.scss';
import type { UploadItem } from '../../hooks/use-upload';

type Props = {
	/**
	 * A queue-item context tag whose uploads already have a progress surface
	 * on the current screen. Suppression rule as shipped: the pill renders
	 * nothing while EVERY queue item carries this context — the /upload
	 * stage passes its 'upload-onboarding' tag because the edit step's
	 * player slot is that session's progress surface. One foreign item in
	 * the queue and the pill is back.
	 */
	suppressContext?: string;
};

const isSettledItem = ( item: UploadItem ): boolean =>
	item.status === 'success' || item.status === 'failed';

/**
 * Per-file row inside the expanded pill: name, live progress or settled
 * state, and the one action that state supports — Cancel in flight, Retry on
 * failure, "Add details" once the video exists.
 *
 * @param props             - Component props.
 * @param props.item        - The queue item to render.
 * @param props.onCancel    - Cancel this row's upload (confirm-guarded by the caller).
 * @param props.onRetry     - Re-dispatch this row's upload.
 * @param props.onToDetails - Open this row's finished video.
 * @return The row element.
 */
const PillRow = ( {
	item,
	onCancel,
	onRetry,
	onToDetails,
}: {
	item: UploadItem;
	onCancel: ( item: UploadItem ) => void;
	onRetry: ( item: UploadItem ) => void;
	onToDetails: ( item: UploadItem ) => void;
} ) => {
	const percent = Math.round( item.progress * 100 );

	let status = null;
	let action;
	if ( item.status === 'success' ) {
		action = (
			<Button size="compact" variant="minimal" onClick={ () => onToDetails( item ) }>
				{ __( 'Add details', 'jetpack-videopress-pkg' ) }
			</Button>
		);
	} else if ( item.status === 'failed' ) {
		status = (
			<Text variant="body-sm" className="vp-upload-pill__row-error">
				{ item.error || __( 'Upload failed.', 'jetpack-videopress-pkg' ) }
			</Text>
		);
		action = (
			<Button size="compact" variant="minimal" onClick={ () => onRetry( item ) }>
				{ __( 'Retry', 'jetpack-videopress-pkg' ) }
			</Button>
		);
	} else {
		status = (
			<div className="vp-upload-pill__row-progress">
				<ProgressBar value={ percent } className="vp-upload-pill__bar" />
				<Text variant="body-sm" className="vp-upload-pill__row-percent">
					{ item.status === 'pending'
						? __( 'Waiting…', 'jetpack-videopress-pkg' )
						: sprintf(
								/* translators: %d: upload percentage. */
								__( '%d%%', 'jetpack-videopress-pkg' ),
								percent
						  ) }
				</Text>
			</div>
		);
		action = (
			<Button size="compact" variant="minimal" onClick={ () => onCancel( item ) }>
				{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
			</Button>
		);
	}

	return (
		<li className="vp-upload-pill__row">
			<div className="vp-upload-pill__row-top">
				<Text variant="body-sm" className="vp-upload-pill__row-name" title={ item.file.name }>
					{ item.file.name }
				</Text>
				{ action }
			</div>
			{ status }
		</li>
	);
};

/**
 * The consolidated upload pill: one floating bottom-right surface, mounted on
 * every dashboard screen, reporting the shared upload queue as a batch.
 * Collapsed it shows the combined label and one progress bar; expanded it
 * lists per-file rows with their own progress and actions. Once everything
 * has settled with at least one success, the primary action becomes "Add
 * details" for the first finished video — acknowledging that row as it
 * navigates, so the remaining rows are the chain of videos still awaiting
 * details.
 *
 * The X is not Cancel: it acknowledges settled rows and collapses. In-flight
 * rows keep uploading and keep the (collapsed) pill on screen; the pill
 * unmounts by itself once the queue is empty.
 *
 * @param props                 - Component props.
 * @param props.suppressContext - Context tag whose uploads the pill stands down for.
 * @return The pill element, or null while there is nothing to report.
 */
export default function UploadPill( { suppressContext }: Props ) {
	const { uploadQueue, retryUpload, cancelUpload, acknowledgeUpload } = useUpload();
	const navigate = useNavigate();
	const [ isExpanded, setIsExpanded ] = useState( false );

	const items = uploadQueue;
	const activeCount = items.filter(
		item => item.status === 'pending' || item.status === 'uploading'
	).length;
	const succeeded = items.filter( item => item.status === 'success' );
	const failedCount = items.filter( item => item.status === 'failed' ).length;

	// One polite live region, announcing batch-level transitions only —
	// started / everything settled / a new failure — never per-percent
	// updates, which would spam screen readers on every progress event.
	const [ liveMessage, setLiveMessage ] = useState( '' );
	const phaseRef = useRef< 'idle' | 'uploading' | 'settled' >( 'idle' );
	const failedCountRef = useRef( 0 );
	useEffect( () => {
		let phase: 'idle' | 'uploading' | 'settled' = 'settled';
		if ( items.length === 0 ) {
			phase = 'idle';
		} else if ( activeCount > 0 ) {
			phase = 'uploading';
		}
		if ( phase !== phaseRef.current ) {
			phaseRef.current = phase;
			if ( phase === 'uploading' ) {
				setLiveMessage( __( 'Video uploads started.', 'jetpack-videopress-pkg' ) );
			} else if ( phase === 'settled' ) {
				setLiveMessage( __( 'All video uploads finished.', 'jetpack-videopress-pkg' ) );
			}
		}
		if ( failedCount > failedCountRef.current ) {
			setLiveMessage( __( 'A video upload failed.', 'jetpack-videopress-pkg' ) );
		}
		failedCountRef.current = failedCount;
	}, [ items.length, activeCount, failedCount ] );

	const isSuppressed =
		suppressContext !== undefined &&
		items.length > 0 &&
		items.every( item => item.context === suppressContext );

	// Rendered via a conditional at the bottom rather than an early
	// `return null` here: the hooks above must run on every render, and an
	// early return would leave everything below assigned-then-unused on the
	// hidden path.
	const isHidden = items.length === 0 || isSuppressed;

	// Batch progress is a simple average with settled successes counting as
	// complete; failed rows are excluded so a dead row can't hold the number
	// down for the rest of the batch.
	const counted = items.filter( item => item.status !== 'failed' );
	const percent = counted.length
		? Math.round(
				( counted.reduce( ( sum, item ) => sum + item.progress, 0 ) / counted.length ) * 100
		  )
		: 0;

	const isSettled = activeCount === 0;
	let label: string;
	if ( ! isSettled ) {
		label = sprintf(
			/* translators: 1: number of videos uploading. 2: combined upload percentage. */
			_n(
				'Uploading %1$d video — %2$d%%',
				'Uploading %1$d videos — %2$d%%',
				activeCount,
				'jetpack-videopress-pkg'
			),
			activeCount,
			percent
		);
	} else if ( succeeded.length > 0 ) {
		label = sprintf(
			/* translators: %d: number of uploaded videos. */
			_n( '%d video uploaded', '%d videos uploaded', succeeded.length, 'jetpack-videopress-pkg' ),
			succeeded.length
		);
	} else {
		label = sprintf(
			/* translators: %d: number of failed uploads. */
			_n( '%d upload failed', '%d uploads failed', failedCount, 'jetpack-videopress-pkg' ),
			failedCount
		);
	}

	const onCancel = ( item: UploadItem ) => {
		const message = sprintf(
			/* translators: %s: video file name. */
			__( 'Cancel uploading “%s”?', 'jetpack-videopress-pkg' ),
			item.file.name
		);
		// Cancel discards an in-flight upload and cannot be undone, hence the guard.
		// eslint-disable-next-line no-alert
		if ( window.confirm( message ) ) {
			cancelUpload( item.id );
		}
	};

	const onToDetails = ( item: UploadItem ) => {
		if ( ! item.media ) {
			return;
		}
		acknowledgeUpload( item.id );
		navigate( { href: `/video/${ item.media.id }` } );
	};

	const onDismiss = () => {
		items.filter( isSettledItem ).forEach( item => acknowledgeUpload( item.id ) );
		setIsExpanded( false );
	};

	return isHidden ? null : (
		<div
			className="vp-upload-pill"
			role="region"
			aria-label={ __( 'Video uploads', 'jetpack-videopress-pkg' ) }
		>
			<VisuallyHidden>
				<div aria-live="polite">{ liveMessage }</div>
			</VisuallyHidden>
			<div className="vp-upload-pill__header">
				<div className="vp-upload-pill__summary">
					<Text variant="body-sm" className="vp-upload-pill__label">
						{ label }
					</Text>
					{ ! isSettled && <ProgressBar value={ percent } className="vp-upload-pill__bar" /> }
				</div>
				{ isSettled && succeeded.length > 0 && (
					<Button size="compact" variant="solid" onClick={ () => onToDetails( succeeded[ 0 ] ) }>
						{ __( 'Add details', 'jetpack-videopress-pkg' ) }
					</Button>
				) }
				<IconButton
					size="compact"
					variant="minimal"
					icon={ isExpanded ? chevronDown : chevronUp }
					label={
						isExpanded
							? __( 'Hide upload details', 'jetpack-videopress-pkg' )
							: __( 'Show upload details', 'jetpack-videopress-pkg' )
					}
					aria-expanded={ isExpanded }
					onClick={ () => setIsExpanded( expanded => ! expanded ) }
				/>
				<IconButton
					size="compact"
					variant="minimal"
					icon={ close }
					label={ __( 'Dismiss finished uploads', 'jetpack-videopress-pkg' ) }
					onClick={ onDismiss }
				/>
			</div>
			{ isExpanded && (
				<ul className="vp-upload-pill__rows">
					{ items.map( item => (
						<PillRow
							key={ item.id }
							item={ item }
							onCancel={ onCancel }
							onRetry={ ( row: UploadItem ) => retryUpload( row.id ) }
							onToDetails={ onToDetails }
						/>
					) ) }
				</ul>
			) }
		</div>
	);
}
