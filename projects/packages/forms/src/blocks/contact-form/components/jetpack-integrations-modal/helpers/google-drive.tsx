import { Button, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import GoogleSheetsIcon from '../../../../../icons/google-sheets';
import GoogleDriveConnectButton from '../components/google-drive-connect-button';
import GoogleDriveDisconnectButton from '../components/google-drive-disconnect-button';
import type { CardItem, CardBuilderProps } from './types';

export function buildGoogleDriveCard( {
	integration,
	refreshIntegrations,
	context,
	handlers,
}: CardBuilderProps ): CardItem {
	const isConnected = !! integration.isConnected;
	const settingsUrl = integration.settingsUrl as string | undefined;

	const defaultResponsesUrl = '/wp-admin/admin.php?page=jetpack-forms-admin';
	const responsesUrl =
		( window as unknown as { jpFormsBlocks?: { defaults?: { formsResponsesUrl?: string } } } )
			.jpFormsBlocks?.defaults?.formsResponsesUrl || defaultResponsesUrl;
	const base: CardItem = {
		id: integration.id,
		title: integration.title,
		description: integration.subtitle,
		icon: <GoogleSheetsIcon className="google-sheets-icon" />,
		cardData: {
			...integration,
			isLoading: typeof integration.isInstalled === 'undefined',
			refreshStatus: refreshIntegrations,
			slug: 'google-sheets',
			showHeaderToggle: false,
			isActive: !! integration.isConnected,
			trackEventName: 'jetpack_forms_upsell_googledrive_click',
		},
		body: ! isConnected ? (
			<div>
				<p className="integration-card__description">
					{ __(
						'Connect your site to Google Drive to export form responses directly to Google Sheets.',
						'jetpack-forms'
					) }
				</p>
				<GoogleDriveConnectButton
					settingsUrl={ settingsUrl }
					onConnected={ refreshIntegrations }
					isConnected={ isConnected }
				/>
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
					{ context === 'dashboard' && handlers?.goToResponses ? (
						<Button variant="link" onClick={ handlers.goToResponses }>
							{ __( 'View form responses', 'jetpack-forms' ) }
						</Button>
					) : (
						<Button variant="link" href={ responsesUrl } target="_blank" rel="noopener noreferrer">
							{ __( 'View form responses', 'jetpack-forms' ) }
						</Button>
					) }
					<span>|</span>
					<GoogleDriveDisconnectButton
						onDisconnected={ refreshIntegrations }
						isConnected={ isConnected }
					/>
				</HStack>
			</div>
		),
	};

	return base;
}
