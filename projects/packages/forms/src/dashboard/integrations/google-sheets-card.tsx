import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import GoogleSheetsIcon from '../../icons/google-sheets';
import type { IntegrationCardProps, JPFormsBlocksWindow } from './types';

const FORM_RESPONSES_URL =
	( window as JPFormsBlocksWindow ).jpFormsBlocks?.defaults?.formsResponsesUrl ||
	'/wp-admin/admin.php?page=jetpack-forms';

const GoogleSheetsDashboardCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
}: IntegrationCardProps ) => {
	const isConnected = !! data?.isConnected;
	const settingsUrl = data?.settingsUrl;

	const cardData = {
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

	return (
		<IntegrationCard
			title={ __( 'Google Sheets', 'jetpack-forms' ) }
			description={ __( 'Export form responses to Google Sheets.', 'jetpack-forms' ) }
			// @ts-expect-error: IntegrationCard icon prop accepts JSX.Element
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
					<div style={ { display: 'flex', gap: '8px', alignItems: 'center' } }>
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
							{ __( 'Refresh Status', 'jetpack-forms' ) }
						</Button>
					</div>
				</div>
			) : (
				<div>
					<p className="integration-card__description">
						{ __(
							'Google Sheets is connected. You can export your form responses from the form responses page.',
							'jetpack-forms'
						) }
					</p>
					<div className="integration-card__links">
						<Button
							variant="link"
							href={ FORM_RESPONSES_URL }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'View Form Responses', 'jetpack-forms' ) }
						</Button>
					</div>
				</div>
			) }
		</IntegrationCard>
	);
};

export default GoogleSheetsDashboardCard;
