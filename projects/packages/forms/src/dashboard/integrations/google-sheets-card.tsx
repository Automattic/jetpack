/**
 * External dependencies
 */
import requestExternalAccess from '@automattic/request-external-access';
import apiFetch from '@wordpress/api-fetch';
import { Button, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useNavigate } from 'react-router';
/**
 * Internal dependencies
 */
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import GoogleSheetsIcon from '../../icons/google-sheets';
/**
 * Types
 */
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../types';

const GoogleSheetsDashboardCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
}: SingleIntegrationCardProps ) => {
	const isConnected = !! data?.isConnected;
	const settingsUrl = data?.settingsUrl;
	const navigate = useNavigate();
	const [ isTogglingConnection, setIsTogglingConnection ] = useState( false );

	useEffect( () => {
		setIsTogglingConnection( false );
	}, [ isConnected ] );

	const cardData: IntegrationCardData = {
		...data,
		slug: 'google-sheets',
		showHeaderToggle: false, // Always off for dashboard
		isLoading: ! data,
		refreshStatus,
		trackEventName: 'jetpack_forms_upsell_googledrive_click',
		isActive: !! data?.isConnected,
	};

	const handleConnectClick = useCallback( () => {
		if ( ! settingsUrl ) return;
		setIsTogglingConnection( true );
		requestExternalAccess( settingsUrl, ( { keyring_id: keyringId } ) => {
			if ( keyringId ) {
				refreshStatus();
			} else {
				setIsTogglingConnection( false );
			}
		} );
	}, [ settingsUrl, refreshStatus ] );

	const handleViewResponsesClick = useCallback( () => {
		navigate( '/responses' );
	}, [ navigate ] );

	const handleDisconnectClick = useCallback( () => {
		setIsTogglingConnection( true );
		apiFetch( {
			method: 'DELETE',
			path: '/wp/v2/feedback/integrations/google-drive',
		} )
			.then( ( response: { deleted: boolean } ) => {
				if ( response.deleted ) {
					refreshStatus();
				} else {
					setIsTogglingConnection( false );
				}
			} )
			.catch( () => {
				setIsTogglingConnection( false );
			} );
	}, [ refreshStatus ] );

	return (
		<IntegrationCard
			title={ data?.title }
			description={ data?.subtitle }
			icon={ <GoogleSheetsIcon className="google-sheets-icon" /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
		>
			{ ! isConnected ? (
				<div>
					<p className="integration-card__description">
						{ __(
							'Connect your site to Google Drive to export form responses directly to Google Sheets.',
							'jetpack-forms'
						) }
					</p>
					<HStack spacing="3" justify="start">
						<Button
							variant="secondary"
							onClick={ handleConnectClick }
							target="_blank"
							rel="noopener noreferrer"
							__next40pxDefaultSize={ true }
							disabled={ ! settingsUrl || isTogglingConnection }
						>
							{ isTogglingConnection
								? __( 'Connecting…', 'jetpack-forms' )
								: _x(
										'Connect to Google Drive',
										'', // Dummy context to avoid bad minification. See https://github.com/Automattic/jetpack/tree/e3f007ec7ac80715f3d82db33c9ed8098a7b45b4/projects/js-packages/i18n-check-webpack-plugin#conditional-function-call-compaction
										'jetpack-forms'
								  ) }
						</Button>
					</HStack>
				</div>
			) : (
				<div>
					<p className="integration-card__description">
						{ __(
							'Google Sheets is connected. You can export your form responses from the form responses page.',
							'jetpack-forms'
						) }
					</p>
					<HStack spacing="2" justify="start" className="integration-card__links">
						<Button variant="link" onClick={ handleViewResponsesClick }>
							{ __( 'View form responses', 'jetpack-forms' ) }
						</Button>
						<span>|</span>
						<Button
							variant="link"
							onClick={ handleDisconnectClick }
							disabled={ isTogglingConnection }
						>
							{ isTogglingConnection
								? __( 'Disconnecting…', 'jetpack-forms' )
								: _x(
										'Disconnect Google Drive',
										'', // Dummy context to avoid bad minification. See https://github.com/Automattic/jetpack/tree/e3f007ec7ac80715f3d82db33c9ed8098a7b45b4/projects/js-packages/i18n-check-webpack-plugin#conditional-function-call-compaction
										'jetpack-forms'
								  ) }
						</Button>
					</HStack>
				</div>
			) }
		</IntegrationCard>
	);
};

export default GoogleSheetsDashboardCard;
