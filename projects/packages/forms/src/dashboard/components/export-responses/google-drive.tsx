/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import requestExternalAccess from '@automattic/request-external-access';
import { Button, Path, Spinner, SVG } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
import { PARTIAL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';
/**
 * Internal dependencies
 */
import type {
	SelectIntegrations,
	IntegrationsDispatch,
} from '../../../store/integrations/index.ts';
import type { Integration } from '../../../types/index.ts';

const GoogleDriveExport = ( { onExport, autoConnect = false } ) => {
	const [ isExporting, setIsExporting ] = useState( false );
	const { integration } = useSelect( ( select: SelectIntegrations ) => {
		const store = select( INTEGRATIONS_STORE );
		const list = store.getIntegrations() || [];
		return { integration: list.find( ( i: Integration ) => i.id === 'google-drive' ) };
	}, [] ) as { integration?: Integration };
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE ) as IntegrationsDispatch;
	const isConnectedToGoogleDrive = !! integration?.isConnected;
	const gdriveConnectSupportURL = useConfigValue( 'gdriveConnectSupportURL' );
	const { tracks } = useAnalytics();
	const autoConnectOpened = useRef( false );
	const [ isTogglingConnection, setIsTogglingConnection ] = useState( false );

	const { isUserConnected, handleConnectUser, userIsConnecting, isOfflineMode } = useConnection( {
		redirectUri: PARTIAL_RESPONSES_PATH + '&connect-gdrive=true',
	} );

	const needsUserConnection = ! isSimpleSite() && ! isUserConnected;

	const exportToGoogleDrive = useCallback( () => {
		if ( isExporting ) {
			return;
		}
		setIsExporting( true );
		tracks.recordEvent( 'jetpack_forms_export_click', {
			destination: 'google-drive',
			screen: 'form-responses-inbox',
		} );

		onExport( 'grunion_export_to_gdrive', 'feedback_export_nonce_gdrive' )
			.then( ( response: Response ) => response.json() )
			.then( ( { data } ) => {
				window.open( data.sheet_link, '_blank' );
			} )
			.finally( () => {
				setIsExporting( false );
			} );
	}, [ tracks, onExport, isExporting ] );

	const handleConnectClick = useCallback( () => {
		if ( ! integration?.settingsUrl ) return;
		tracks.recordEvent( 'jetpack_forms_upsell_googledrive_click', {
			screen: 'form-responses-inbox',
		} );
		setIsTogglingConnection( true );
		requestExternalAccess( integration?.settingsUrl, ( { keyring_id: keyringId } ) => {
			if ( keyringId ) {
				refreshIntegrations();
			} else {
				setIsTogglingConnection( false );
			}
		} );
	}, [ tracks, integration?.settingsUrl, refreshIntegrations ] );

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
									href={ gdriveConnectSupportURL }
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
									isBusy={ isExporting }
								>
									{ __( 'Export', 'jetpack-forms' ) }
								</Button>
							) }

							{ ! isConnectedToGoogleDrive && needsUserConnection && (
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

							{ ! isConnectedToGoogleDrive && ! needsUserConnection && (
								<Button
									className={ buttonClasses }
									variant="primary"
									rel="noopener noreferrer"
									target="_blank"
									onClick={ handleConnectClick }
									disabled={ ! integration?.settingsUrl || isTogglingConnection }
									ref={ el => {
										if ( autoConnect && ! autoConnectOpened.current ) {
											el?.click();
											autoConnectOpened.current = true;
										}
									} }
								>
									{ isTogglingConnection
										? __( 'Connecting…', 'jetpack-forms' )
										: _x(
												'Connect to Google Drive',
												'', // Dummy context to avoid bad minification. See https://github.com/Automattic/jetpack/tree/e3f007ec7ac80715f3d82db33c9ed8098a7b45b4/projects/js-packages/i18n-check-webpack-plugin#conditional-function-call-compaction
												'jetpack-forms'
										  ) }
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
