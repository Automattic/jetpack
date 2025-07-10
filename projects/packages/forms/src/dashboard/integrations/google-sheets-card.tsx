/**
 * External dependencies
 */
import { Button, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
		window.open( settingsUrl, '_blank', 'noopener,noreferrer' );
	}, [ settingsUrl ] );

	const handleViewResponsesClick = useCallback( () => {
		navigate( '/responses' );
	}, [ navigate ] );

	return (
		<IntegrationCard
			title={ __( 'Google Sheets', 'jetpack-forms' ) }
			description={ __( 'Export form responses to Google Sheets.', 'jetpack-forms' ) }
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
							disabled={ ! settingsUrl }
						>
							{ __( 'Connect to Google Drive', 'jetpack-forms' ) }
						</Button>
						<Button variant="tertiary" onClick={ refreshStatus } __next40pxDefaultSize={ true }>
							{ __( 'Refresh status', 'jetpack-forms' ) }
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
							{ __( 'View Form Responses', 'jetpack-forms' ) }
						</Button>
						<span>|</span>
						<Button
							variant="link"
							onClick={ handleConnectClick }
							target="_blank"
							rel="noopener noreferrer"
							disabled={ ! settingsUrl }
						>
							{ __( 'Disconnect Google Drive', 'jetpack-forms' ) }
						</Button>
					</HStack>
				</div>
			) }
		</IntegrationCard>
	);
};

export default GoogleSheetsDashboardCard;
