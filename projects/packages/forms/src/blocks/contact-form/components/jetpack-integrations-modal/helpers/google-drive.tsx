import { Button, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Badge, Link } from '@wordpress/ui';
import GoogleSheetsIcon from '../../../../../icons/google-sheets.tsx';
import GoogleDriveConnectButton from '../components/google-drive-connect-button.tsx';
import GoogleDriveDisconnectButton from '../components/google-drive-disconnect-button.tsx';
import GoogleSheetsSyncControls from '../components/google-sheets-sync-controls.tsx';
import type { CardItem, CardBuilderProps } from './types.ts';
import type { GoogleSheetsData } from '../components/google-sheets-sync-controls.tsx';

/**
 * The post the form is being edited in.
 *
 * Used both to scope a backfill to this form's responses and to read the form's
 * field labels server-side. It is correct for a standalone synced form, where it
 * is the jetpack_form post, and for a form embedded in a page, where responses
 * hang off the page instead.
 *
 * @return The current post ID, or 0 when there is no editor context.
 */
function useCurrentPostId(): number {
	return useSelect( select => {
		const editor = select( 'core/editor' ) as { getCurrentPostId?: () => number };
		return editor?.getCurrentPostId?.() || 0;
	}, [] );
}

/**
 * Explains why the syncing toggle cannot be switched on yet.
 *
 * @param isConnected    - Whether the site has a Google Drive connection.
 * @param hasSpreadsheet - Whether a destination spreadsheet has been chosen.
 * @return The tooltip text, or undefined when the toggle is usable.
 */
function getToggleDisabledTooltip(
	isConnected: boolean,
	hasSpreadsheet: boolean
): string | undefined {
	if ( ! isConnected ) {
		return __( 'Connect to Google Drive to enable.', 'jetpack-forms' );
	}

	if ( ! hasSpreadsheet ) {
		return __( 'Choose a spreadsheet to enable.', 'jetpack-forms' );
	}

	return undefined;
}

export function buildGoogleDriveCard( {
	integration,
	refreshIntegrations,
	context,
	handlers,
	attributes,
	setAttributes,
}: CardBuilderProps ): CardItem {
	const isConnected = !! integration.isConnected;
	const settingsUrl = integration.settingsUrl as string | undefined;

	const defaultResponsesUrl = '/wp-admin/admin.php?page=jetpack-forms-admin';
	const responsesUrl =
		( window as unknown as { jpFormsBlocks?: { defaults?: { formsResponsesUrl?: string } } } )
			.jpFormsBlocks?.defaults?.formsResponsesUrl || defaultResponsesUrl;

	const googleSheetsData = ( attributes?.googleSheetsData ?? {} ) as GoogleSheetsData;
	const isSyncing = !! googleSheetsData.enabled && !! googleSheetsData.spreadsheetId;

	const setGoogleSheetsData = ( data: GoogleSheetsData ) =>
		setAttributes?.( { googleSheetsData: { ...googleSheetsData, ...data } } );

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
			isActive: !! integration.isConnected,
			trackEventName: 'jetpack_forms_upsell_googledrive_click',
			// Syncing is configured per form, so the toggle only belongs in the
			// editor. The dashboard renders this card without any form context.
			showHeaderToggle: context === 'block-editor',
			...( context === 'block-editor' && {
				headerToggleValue: isSyncing,
				// Nothing to switch on until a spreadsheet has been chosen, and
				// nothing to switch at all without a Google Drive connection.
				isHeaderToggleEnabled: isConnected && !! googleSheetsData.spreadsheetId,
				onHeaderToggleChange: ( value: boolean ) => setGoogleSheetsData( { enabled: value } ),
				toggleDisabledTooltip: getToggleDisabledTooltip(
					isConnected,
					!! googleSheetsData.spreadsheetId
				),
			} ),
			...( context === 'dashboard' && {
				setupBadge: (
					<Badge intent="stable" className="integration-card__setup-badge">
						{ __( 'Configured per form', 'jetpack-forms' ) }
					</Badge>
				),
			} ),
		},
		body: ! isConnected ? (
			<div>
				<p className="integration-card__description">
					{ __(
						'Connect your site to Google Drive to send form responses to Google Sheets.',
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
				{ context === 'block-editor' ? (
					<GoogleSheetsSyncControlsWrapper
						googleSheetsData={ googleSheetsData }
						setGoogleSheetsData={ setGoogleSheetsData }
						formTitle={ ( attributes?.formTitle as string ) || '' }
					/>
				) : (
					<p className="integration-card__description">
						{ __(
							'Google Sheets is connected. Syncing responses is switched on for each form individually in the editor.',
							'jetpack-forms'
						) }
					</p>
				) }
				<HStack spacing="2" justify="start" className="integration-card__links">
					{ context === 'dashboard' && handlers?.goToResponses ? (
						<Button variant="link" onClick={ handlers.goToResponses }>
							{ __( 'View form responses', 'jetpack-forms' ) }
						</Button>
					) : (
						<Link openInNewTab href={ responsesUrl }>
							{ __( 'View form responses', 'jetpack-forms' ) }
						</Link>
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

/**
 * Reads the current post ID and renders the sync controls.
 *
 * Split into a component because the post ID comes from a hook, and this card is
 * built by a plain function rather than rendered as one.
 *
 * @param props                     - Component props.
 * @param props.googleSheetsData    - The form's current sync configuration.
 * @param props.setGoogleSheetsData - Persists a change to that configuration.
 * @param props.formTitle           - The form's title, used to name a new spreadsheet.
 * @return The sync controls.
 */
function GoogleSheetsSyncControlsWrapper( {
	googleSheetsData,
	setGoogleSheetsData,
	formTitle,
}: {
	googleSheetsData: GoogleSheetsData;
	setGoogleSheetsData: ( data: GoogleSheetsData ) => void;
	formTitle: string;
} ) {
	const formPostId = useCurrentPostId();

	return (
		<GoogleSheetsSyncControls
			googleSheetsData={ googleSheetsData }
			setGoogleSheetsData={ setGoogleSheetsData }
			formPostId={ formPostId }
			formTitle={ formTitle }
		/>
	);
}
