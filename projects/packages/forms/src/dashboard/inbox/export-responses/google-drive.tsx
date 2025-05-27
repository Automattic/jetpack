/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Path, Spinner, SVG } from '@wordpress/components';
import { useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { config } from '../..';
import { useIntegrationStatus } from '../../../blocks/contact-form/components/jetpack-integrations-modal/hooks/useIntegrationStatus';
import { PARTIAL_RESPONSES_PATH, PREFERRED_VIEW } from '../../../util/get-preferred-responses-view';

const GoogleDriveExport = ( { onExport, autoConnect = false } ) => {
	const { integration, refreshStatus } = useIntegrationStatus( 'google-drive' );
	const isConnectedToGoogleDrive = !! integration?.isConnected;
	const { tracks } = useAnalytics();
	const autoConnectOpened = useRef( false );

	const { isUserConnected, handleConnectUser, userIsConnecting, isOfflineMode } = useConnection( {
		redirectUri:
			PARTIAL_RESPONSES_PATH + ( PREFERRED_VIEW === 'classic' ? '' : '&connect-gdrive=true' ),
	} );

	const pollForConnection = useCallback( () => {
		const interval = setInterval( async () => {
			if ( isConnectedToGoogleDrive ) {
				clearInterval( interval );
				return;
			}

			try {
				await refreshStatus();
			} catch {
				clearInterval( interval );
			}
		}, 5000 );
	}, [ isConnectedToGoogleDrive, refreshStatus ] );

	const exportToGoogleDrive = useCallback( () => {
		tracks.recordEvent( 'jetpack_forms_export_click', {
			destination: 'google-drive',
			screen: 'form-responses-inbox',
		} );

		onExport( 'grunion_export_to_gdrive', 'feedback_export_nonce_gdrive' )
			.then( response => response.json() )
			.then( ( { data } ) => {
				window.open( data.sheet_link, '_blank' );
			} );
	}, [ tracks, onExport ] );

	const handleConnectClick = useCallback( () => {
		pollForConnection();

		tracks.recordEvent( 'jetpack_forms_upsell_googledrive_click', {
			screen: 'form-responses-inbox',
		} );
	}, [ tracks, pollForConnection ] );

	if ( isOfflineMode ) {
		return null;
	}

	const buttonClasses = clsx( 'button', 'export-button', 'export-gdrive' );

	return (
		<div className="jp-forms__export-modal-card">
			<div className="jp-forms__export-modal-card-header">
				<SVG
					width="18"
					height="24"
					viewBox="0 0 18 24"
					fill="none"
					xmlns="http://www.w3.org/2000/SVG"
				>
					<Path
						d="M11.8387 1.16016H2C1.44772 1.16016 1 1.60787 1 2.16016V21.8053V21.8376C1 22.3899 1.44772 22.8376 2 22.8376H16C16.5523 22.8376 17 22.3899 17 21.8376V5.80532M11.8387 1.16016V5.80532H17M11.8387 1.16016L17 5.80532M4.6129 13.0311V16.1279H9.25806M4.6129 13.0311V9.93435H9.25806M4.6129 13.0311H13.9032M13.9032 13.0311V9.93435H9.25806M13.9032 13.0311V16.1279H9.25806M9.25806 9.93435V16.1279"
						stroke="#008710"
						strokeWidth="1.5"
					/>
				</SVG>
				<div className="jp-forms__export-modal-card-header-title">
					{ __( 'Google Sheets', 'jetpack-forms' ) }
				</div>
			</div>
			<div className="jp-forms__export-modal-card-body">
				<div className="jp-forms__export-modal-card-body-description">
					<div>
						{ __( 'Export your data into a Google Sheets file.', 'jetpack-forms' ) }
						{ ! isConnectedToGoogleDrive && (
							<>
								&nbsp;
								<a
									href={ config( 'gdriveConnectSupportURL' ) }
									title={ __( 'Connect to Google Drive', 'jetpack-forms' ) }
									target="_blank"
									rel="noopener noreferrer"
								>
									{ __( 'You need to connect to Google Drive.', 'jetpack-forms' ) }
								</a>
							</>
						) }
					</div>
				</div>
				<div className="jp-forms__export-modal-card-body-cta">
					{ ! integration ? (
						<Spinner />
					) : (
						<>
							{ isConnectedToGoogleDrive && (
								<Button
									className={ buttonClasses }
									variant="primary"
									onClick={ exportToGoogleDrive }
								>
									{ __( 'Export', 'jetpack-forms' ) }
								</Button>
							) }

							{ ! isConnectedToGoogleDrive && ! isUserConnected && (
								<Button
									className={ buttonClasses }
									variant="primary"
									rel="noopener noreferrer"
									target="_blank"
									onClick={ handleConnectUser }
									isBusy={ userIsConnecting }
								>
									{ __( 'Connect Jetpack user account', 'jetpack-forms' ) }
								</Button>
							) }

							{ ! isConnectedToGoogleDrive && isUserConnected && (
								<Button
									href={ integration?.settingsUrl }
									className={ buttonClasses }
									variant="primary"
									rel="noopener noreferrer"
									target="_blank"
									onClick={ handleConnectClick }
									ref={ el => {
										if ( autoConnect && ! autoConnectOpened.current ) {
											el?.click();
											autoConnectOpened.current = true;
										}
									} }
								>
									{ __( 'Connect to Google Drive', 'jetpack-forms' ) }
								</Button>
							) }
						</>
					) }
				</div>
			</div>
		</div>
	);
};

export default GoogleDriveExport;
