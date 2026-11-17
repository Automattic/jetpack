/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Path, SVG } from '@wordpress/primitives';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import countCsvRows from './count-csv-rows';
import ProgressRing from './progress-ring';

const NOTICE_ID = 'jetpack-forms-export-csv';

type DownloadProgress = {
	bytes: number;
	/** CSV rows completed so far, header included. */
	rows: number;
	/** Responses per second over the last few seconds, or 0 until there is enough data. */
	rate: number;
};

const RATE_WINDOW_MS = 3000;

/**
 * Reads a response body into a Blob, reporting progress after each chunk.
 *
 * @param {Response}                             response   - The export response.
 * @param {(progress: DownloadProgress) => void} onProgress - Called after each chunk.
 * @return {Promise<Blob>} The whole body.
 */
async function readWithProgress(
	response: Response,
	onProgress: ( progress: DownloadProgress ) => void
): Promise< Blob > {
	if ( ! response.body ) {
		return response.blob();
	}
	const reader = response.body.getReader();
	const chunks: BlobPart[] = [];
	let bytes = 0;
	let count = { rows: 0, inQuotes: false };
	// A recent window, not the whole download: the first seconds trickle in and would skew the rate.
	const samples: { time: number; rows: number }[] = [];
	for (;;) {
		const { done, value } = await reader.read();
		if ( done ) {
			break;
		}
		chunks.push( value as Uint8Array< ArrayBuffer > );
		bytes += value.length;
		count = countCsvRows( value, count );

		const now = Date.now();
		samples.push( { time: now, rows: count.rows } );
		while ( samples.length > 1 && now - samples[ 1 ].time >= RATE_WINDOW_MS ) {
			samples.shift();
		}
		const span = now - samples[ 0 ].time;
		const rate = span >= 2000 ? ( ( count.rows - samples[ 0 ].rows ) * 1000 ) / span : 0;
		onProgress( { bytes, rows: count.rows, rate } );
	}
	return new Blob( chunks, { type: response.headers.get( 'Content-Type' ) ?? 'text/csv' } );
}

/**
 * Percentage of responses received, held at 99 until the file is complete.
 *
 * @param {DownloadProgress|null} progress - Progress so far, or null before the first byte.
 * @param {number}                total    - Responses in the export, or 0 when unknown.
 * @return {number|null} The percentage, or null when it can't be known yet.
 */
function getPercent( progress: DownloadProgress | null, total: number ): number | null {
	if ( ! progress || ! total ) {
		return null;
	}
	return Math.min( 99, Math.floor( ( Math.max( 0, progress.rows - 1 ) / total ) * 100 ) );
}

/**
 * Describes how far a download has got: a percentage of responses when the total is known, otherwise megabytes.
 *
 * @param {DownloadProgress|null} progress - Progress so far, or null before the first byte.
 * @param {number}                total    - Responses in the export, or 0 when unknown.
 * @return {string} The progress copy.
 */
function getProgressLabel( progress: DownloadProgress | null, total: number ): string {
	if ( ! progress ) {
		return __( 'Preparing your export…', 'jetpack-forms' );
	}
	if ( ! total ) {
		return sprintf(
			/* translators: %s: amount downloaded so far, in megabytes, e.g. 12.5 */
			__( '%s MB downloaded', 'jetpack-forms' ),
			( progress.bytes / 1000000 ).toFixed( 1 )
		);
	}

	const percent = getPercent( progress, total );
	// The stream speeds up over its first seconds, so earlier estimates run long.
	if ( ! progress.rate || percent < 10 ) {
		/* translators: %d: percentage of responses downloaded so far */
		return sprintf( __( '%d%% downloaded', 'jetpack-forms' ), percent );
	}

	const secondsLeft = ( total - Math.max( 0, progress.rows - 1 ) ) / progress.rate;
	if ( secondsLeft < 5 ) {
		/* translators: %d: percentage of responses downloaded so far */
		return sprintf( __( '%d%% downloaded, almost done', 'jetpack-forms' ), percent );
	}
	if ( secondsLeft < 60 ) {
		return sprintf(
			/* translators: 1: percentage of responses downloaded so far, 2: seconds left, a multiple of 5 */
			__( '%1$d%% downloaded, about %2$d seconds left', 'jetpack-forms' ),
			percent,
			Math.ceil( secondsLeft / 5 ) * 5
		);
	}
	const minutes = Math.round( secondsLeft / 60 );
	return sprintf(
		/* translators: 1: percentage of responses downloaded so far, 2: minutes left */
		_n(
			'%1$d%% downloaded, about %2$d minute left',
			'%1$d%% downloaded, about %2$d minutes left',
			minutes,
			'jetpack-forms'
		),
		percent,
		minutes
	);
}

const CSVExport = ( { onExport } ) => {
	const { tracks } = useAnalytics();
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const [ isDownloading, setIsDownloading ] = useState( false );
	const [ isDone, setIsDone ] = useState( false );
	const [ progress, setProgress ] = useState< DownloadProgress | null >( null );
	const [ total, setTotal ] = useState( 0 );

	const downloadCSV = useCallback( async () => {
		if ( isDownloading ) {
			return;
		}
		tracks.recordEvent( 'jetpack_forms_export_click', {
			destination: 'csv',
			screen: 'form-responses-inbox',
		} );

		setIsDownloading( true );
		setIsDone( false );
		setProgress( null );
		setTotal( 0 );
		createInfoNotice( __( 'Preparing your export…', 'jetpack-forms' ), {
			type: 'snackbar',
			id: NOTICE_ID,
		} );

		try {
			const response = await onExport( 'feedback_export', 'feedback_export_nonce_csv' );
			if ( ! response.ok ) {
				throw new Error( response.statusText );
			}
			setTotal( Number( response.headers.get( 'X-Jetpack-Forms-Export-Count' ) ) || 0 );
			const blob = await readWithProgress( response, setProgress );

			const a = document.createElement( 'a' );
			a.href = window.URL.createObjectURL( blob );

			const contentDispositionHeader = response.headers.get( 'Content-Disposition' ) ?? '';
			a.download =
				contentDispositionHeader.split( 'filename=' )[ 1 ] || 'Jetpack Form Responses.csv';

			document.body.appendChild( a );
			a.click();
			document.body.removeChild( a );
			window.URL.revokeObjectURL( a.href );

			setIsDone( true );
			createSuccessNotice( __( 'Your responses were downloaded.', 'jetpack-forms' ), {
				type: 'snackbar',
				id: NOTICE_ID,
			} );
		} catch {
			createErrorNotice(
				__( 'Could not export your responses. Please try again.', 'jetpack-forms' ),
				{
					type: 'snackbar',
					id: NOTICE_ID,
				}
			);
		} finally {
			setIsDownloading( false );
		}
	}, [
		onExport,
		tracks,
		isDownloading,
		createInfoNotice,
		createSuccessNotice,
		createErrorNotice,
	] );

	const percent = getPercent( progress, total );
	const buttonClasses = clsx( 'button', 'export-button', 'export-csv' );

	return (
		<div className="jp-forms__export-modal-card">
			<div className="jp-forms__export-modal-card-header">
				<SVG
					width="22"
					height="20"
					viewBox="0 0 22 20"
					fill="none"
					xmlns="http://www.w3.org/2000/SVG"
				>
					<Path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M11.2309 5.04199L10.0797 2.73945C9.98086 2.54183 9.77887 2.41699 9.55792 2.41699H2.83333C2.51117 2.41699 2.25 2.67816 2.25 3.00033V16.7087C2.25 17.0308 2.51117 17.292 2.83333 17.292H19.1667C19.4888 17.292 19.75 17.0308 19.75 16.7087V5.62533C19.75 5.30316 19.4888 5.04199 19.1667 5.04199H11.2309ZM12.3125 3.29199L11.6449 1.95683C11.2497 1.16633 10.4417 0.666992 9.55792 0.666992H2.83333C1.54467 0.666992 0.5 1.71166 0.5 3.00033V16.7087C0.5 17.9973 1.54467 19.042 2.83333 19.042H19.1667C20.4553 19.042 21.5 17.9973 21.5 16.7087V5.62533C21.5 4.33666 20.4553 3.29199 19.1667 3.29199H12.3125Z"
						fill="#008710"
					/>
				</SVG>
				<div className="jp-forms__export-modal-card-header-title">
					{ __( 'CSV File', 'jetpack-forms' ) }
				</div>
			</div>
			<div className="jp-forms__export-modal-card-body">
				<div className="jp-forms__export-modal-card-body-description jp-forms__export-modal-card-status">
					{ /* Stays laid out while hidden so the card keeps its height. */ }
					<span className={ clsx( { 'is-hidden': isDownloading || isDone } ) }>
						{ __( 'Download your form response data as a CSV file.', 'jetpack-forms' ) }
					</span>
					{ isDownloading && (
						<span className="jp-forms__export-modal-card-progress">
							{ percent === null ? <Spinner /> : <ProgressRing value={ percent } /> }
							{ getProgressLabel( progress, total ) }
						</span>
					) }
					{ isDone && ! isDownloading && (
						<span className="jp-forms__export-modal-card-done">
							<Icon icon={ check } size={ 24 } />
							{ __( "Done. Find the file in your browser's downloads.", 'jetpack-forms' ) }
						</span>
					) }
				</div>
				<div className="jp-forms__export-modal-card-body-cta">
					<Button
						variant="primary"
						className={ buttonClasses }
						onClick={ downloadCSV }
						isBusy={ isDownloading }
						disabled={ isDownloading }
						accessibleWhenDisabled
					>
						{ isDownloading
							? __( 'Downloading…', 'jetpack-forms' )
							: __( 'Download', 'jetpack-forms' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default CSVExport;
