/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { isWpcom } from '../util';

const CSVExport = ( { onExport } ) => {
	const downloadCSV = useCallback( () => {
		onExport( 'feedback_export', 'feedback_export_nonce_csv' ).then( async response => {
			const blob = await response.blob();

			const a = document.createElement( 'a' );
			a.href = window.URL.createObjectURL( blob );

			const contentDispositionHeader = response.headers.get( 'Content-Disposition' ) ?? '';
			a.download =
				contentDispositionHeader.split( 'filename=' )[ 1 ] || 'Jetpack Form Responses.csv';

			document.body.appendChild( a );
			a.click();
			document.body.removeChild( a );
			window.URL.revokeObjectURL( a.href );
		} );
	}, [ onExport ] );

	const buttonClasses = clsx( 'button', 'export-button', 'export-csv', {
		'button-primary': ! isWpcom(),
	} );

	return (
		<div className="jp-forms__export-modal-card">
			<div className="jp-forms__export-modal-card-header">
				<svg
					width="22"
					height="20"
					viewBox="0 0 22 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M11.2309 5.04199L10.0797 2.73945C9.98086 2.54183 9.77887 2.41699 9.55792 2.41699H2.83333C2.51117 2.41699 2.25 2.67816 2.25 3.00033V16.7087C2.25 17.0308 2.51117 17.292 2.83333 17.292H19.1667C19.4888 17.292 19.75 17.0308 19.75 16.7087V5.62533C19.75 5.30316 19.4888 5.04199 19.1667 5.04199H11.2309ZM12.3125 3.29199L11.6449 1.95683C11.2497 1.16633 10.4417 0.666992 9.55792 0.666992H2.83333C1.54467 0.666992 0.5 1.71166 0.5 3.00033V16.7087C0.5 17.9973 1.54467 19.042 2.83333 19.042H19.1667C20.4553 19.042 21.5 17.9973 21.5 16.7087V5.62533C21.5 4.33666 20.4553 3.29199 19.1667 3.29199H12.3125Z"
						fill="#008710"
					/>
				</svg>
				<div className="jp-forms__export-modal-card-header-title">
					{ __( 'CSV File', 'jetpack-forms' ) }
				</div>
			</div>
			<div className="jp-forms__export-modal-card-body">
				<div className="jp-forms__export-modal-card-body-description">
					{ __( 'Download your form response data as a CSV file.', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__export-modal-card-body-cta">
					<button className={ buttonClasses } onClick={ downloadCSV }>
						{ __( 'Download', 'jetpack-forms' ) }
					</button>
				</div>
			</div>
		</div>
	);
};

export default CSVExport;
