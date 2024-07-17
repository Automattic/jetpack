/**
 * External dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { tap } from 'lodash';
/**
 * Internal dependencies
 */
import { config } from '../../';
import { isWpcom } from '../util';

const GoogleDriveExport = ( { onExport } ) => {
	const [ isConnected, setIsConnected ] = useState( config( 'gdriveConnection' ) );

	const pollForConnection = useCallback( () => {
		const interval = setInterval( async () => {
			if ( isConnected ) {
				clearInterval( interval );
				return;
			}

			try {
				const response = await fetch( window.ajaxurl, {
					method: 'POST',
					body: tap( new FormData(), data => {
						data.append( 'action', 'grunion_gdrive_connection' );
						data.append( 'feedback_export_nonce_gdrive', config( 'exportNonce' ) );
					} ),
				} );
				const data = await response.json();

				if ( ! data.connection ) {
					return;
				}

				clearInterval( interval );
				setIsConnected( true );
			} catch ( error ) {
				clearInterval( interval );
			}
		}, 5000 );
	}, [ isConnected ] );

	const exportToGoogleDrive = useCallback( () => {
		onExport( 'grunion_export_to_gdrive', 'feedback_export_nonce_gdrive' )
			.then( response => response.json() )
			.then( ( { data } ) => {
				window.open( data.sheet_link, '_blank' );
			} );
	}, [ onExport ] );

	const buttonClasses = clsx( 'button', 'export-button', 'export-gdrive', {
		'button-primary': ! isWpcom(),
	} );

	return (
		<div className="jp-forms__export-modal-card">
			<div className="jp-forms__export-modal-card-header">
				<svg
					width="18"
					height="24"
					viewBox="0 0 18 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M11.8387 1.16016H2C1.44772 1.16016 1 1.60787 1 2.16016V21.8053V21.8376C1 22.3899 1.44772 22.8376 2 22.8376H16C16.5523 22.8376 17 22.3899 17 21.8376V5.80532M11.8387 1.16016V5.80532H17M11.8387 1.16016L17 5.80532M4.6129 13.0311V16.1279H9.25806M4.6129 13.0311V9.93435H9.25806M4.6129 13.0311H13.9032M13.9032 13.0311V9.93435H9.25806M13.9032 13.0311V16.1279H9.25806M9.25806 9.93435V16.1279"
						stroke="#008710"
						strokeWidth="1.5"
					/>
				</svg>
				<div className="jp-forms__export-modal-card-header-title">
					{ __( 'Google Sheets', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__export-modal-card-beta-badge">BETA</div>
			</div>
			<div className="jp-forms__export-modal-card-body">
				<div className="jp-forms__export-modal-card-body-description">
					<div>
						{ __( 'Export your data into a Google Sheets file.', 'jetpack-forms' ) }
						&nbsp;
						<a
							href={ config( 'gdriveConnectSupportURL' ) }
							title={ __( 'Connect to Google Drive', 'jetpack-forms' ) }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'You need to connect to Google Drive.', 'jetpack-forms' ) }
						</a>
					</div>
					<p className="jp-forms__export-modal-card-body-description-footer">
						{ __( 'This premium feature is currently free to use in beta.', 'jetpack-forms' ) }
					</p>
				</div>
				<div className="jp-forms__export-modal-card-body-cta">
					{ isConnected && (
						<button className={ buttonClasses } onClick={ exportToGoogleDrive }>
							{ __( 'Export', 'jetpack-forms' ) }
						</button>
					) }

					{ ! isConnected && (
						<a
							href={ config( 'gdriveConnectURL' ) }
							className={ buttonClasses }
							rel="noopener noreferrer"
							target="_blank"
							onClick={ pollForConnection }
						>
							{ __( 'Connect to Google Drive', 'jetpack-forms' ) }
						</a>
					) }
				</div>
			</div>
		</div>
	);
};

export default GoogleDriveExport;
