/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Path, SVG } from '@wordpress/primitives';
import clsx from 'clsx';

const NOTICE_ID = 'jetpack-forms-export-csv';

/**
 * Reads a response body into a Blob, reporting how many bytes have arrived so far.
 *
 * @param {Response}                response   - The export response.
 * @param {(bytes: number) => void} onProgress - Called after each chunk.
 * @return {Promise<Blob>} The whole body.
 */
async function readWithProgress(
	response: Response,
	onProgress: ( bytes: number ) => void
): Promise< Blob > {
	if ( ! response.body ) {
		return response.blob();
	}
	const reader = response.body.getReader();
	const chunks: BlobPart[] = [];
	let received = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if ( done ) {
			break;
		}
		chunks.push( value as Uint8Array< ArrayBuffer > );
		received += value.length;
		onProgress( received );
	}
	return new Blob( chunks, { type: response.headers.get( 'Content-Type' ) ?? 'text/csv' } );
}

const CSVExport = ( { onExport } ) => {
	const { tracks } = useAnalytics();
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const [ isDownloading, setIsDownloading ] = useState( false );
	const [ isDone, setIsDone ] = useState( false );
	const [ receivedBytes, setReceivedBytes ] = useState( 0 );

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
		setReceivedBytes( 0 );
		createInfoNotice( __( 'Preparing your export…', 'jetpack-forms' ), {
			type: 'snackbar',
			id: NOTICE_ID,
		} );

		try {
			const response = await onExport( 'feedback_export', 'feedback_export_nonce_csv' );
			if ( ! response.ok ) {
				throw new Error( response.statusText );
			}
			const blob = await readWithProgress( response, setReceivedBytes );

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
							<Spinner />
							{ receivedBytes > 0
								? sprintf(
										/* translators: %s: amount downloaded so far, in megabytes, e.g. 12.5 */
										__( '%s MB downloaded', 'jetpack-forms' ),
										( receivedBytes / 1000000 ).toFixed( 1 )
									)
								: __( 'Preparing your export…', 'jetpack-forms' ) }
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
