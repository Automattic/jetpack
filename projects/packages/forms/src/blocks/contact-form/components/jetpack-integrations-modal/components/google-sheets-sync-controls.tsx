import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	CheckboxControl,
	RadioControl,
	TextControl,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';

export type GoogleSheetsData = {
	enabled?: boolean;
	spreadsheetId?: string;
	spreadsheetUrl?: string;
	columns?: string[];
	userId?: number;
};

type Props = {
	googleSheetsData: GoogleSheetsData;
	setGoogleSheetsData: ( data: GoogleSheetsData ) => void;
	formPostId: number;
	formTitle: string;
};

type SetupResponse = {
	spreadsheetId: string;
	spreadsheetUrl: string;
	columns: string[];
	userId: number;
};

/**
 * Whether a string looks like a Google Sheets document reference.
 *
 * Mirrors Google_Drive::extract_sheet_id() on the server, which is what actually
 * decides. This is only here to keep the user from submitting something the
 * server will certainly reject.
 *
 * @param reference - A pasted spreadsheet URL or bare ID.
 * @return Whether it looks like a spreadsheet reference.
 */
export function looksLikeSpreadsheetReference( reference: string ): boolean {
	const trimmed = ( reference || '' ).trim();

	if ( ! trimmed ) {
		return false;
	}

	return (
		/\/spreadsheets\/d\/[a-zA-Z0-9_-]+/.test( trimmed ) || /^[a-zA-Z0-9_-]{10,}$/.test( trimmed )
	);
}

/**
 * Per-form controls for syncing responses to a Google Spreadsheet.
 *
 * Rendered only once the site has a Google Drive connection; before that the
 * card shows its connect button instead.
 *
 * @param props                     - Component props.
 * @param props.googleSheetsData    - The form's current sync configuration.
 * @param props.setGoogleSheetsData - Persists a change to that configuration.
 * @param props.formPostId          - The post the form is edited in, used to scope backfill and read field labels.
 * @param props.formTitle           - The form's title, used to name a new spreadsheet.
 * @return The sync controls.
 */
export default function GoogleSheetsSyncControls( {
	googleSheetsData,
	setGoogleSheetsData,
	formPostId,
	formTitle,
}: Props ) {
	const [ mode, setMode ] = useState( 'create' );
	const [ spreadsheetUrl, setSpreadsheetUrl ] = useState( '' );
	const [ backfill, setBackfill ] = useState( true );
	const [ isSettingUp, setIsSettingUp ] = useState( false );
	const [ error, setError ] = useState( '' );

	const isConfigured = !! googleSheetsData?.spreadsheetId;

	const handleSetup = useCallback( () => {
		setError( '' );
		setIsSettingUp( true );

		apiFetch< SetupResponse >( {
			path: '/wp/v2/feedback/integrations/google-sheets/setup',
			method: 'POST',
			data: {
				form_post_id: formPostId,
				title: formTitle,
				mode,
				spreadsheet_url: mode === 'existing' ? spreadsheetUrl : '',
				backfill,
			},
		} )
			.then( ( result: SetupResponse ) => {
				setGoogleSheetsData( {
					enabled: true,
					spreadsheetId: result.spreadsheetId,
					spreadsheetUrl: result.spreadsheetUrl,
					columns: result.columns,
					userId: result.userId,
				} );
			} )
			.catch( ( requestError: { message?: string } ) => {
				setError(
					requestError?.message ||
						__( 'The spreadsheet could not be set up. Please try again.', 'jetpack-forms' )
				);
			} )
			.finally( () => {
				setIsSettingUp( false );
			} );
	}, [ formPostId, formTitle, mode, spreadsheetUrl, backfill, setGoogleSheetsData ] );

	if ( isConfigured ) {
		return (
			<VStack spacing="3" className="jp-forms__gsheets-sync">
				<p className="integration-card__description">
					{ __(
						'New responses to this form are added to your spreadsheet as they arrive.',
						'jetpack-forms'
					) }
				</p>
				{ googleSheetsData.spreadsheetUrl && (
					<div>
						<Link openInNewTab href={ googleSheetsData.spreadsheetUrl }>
							{ __( 'Open spreadsheet', 'jetpack-forms' ) }
						</Link>
					</div>
				) }
			</VStack>
		);
	}

	const canSubmit =
		! isSettingUp && ( mode === 'create' || looksLikeSpreadsheetReference( spreadsheetUrl ) );

	return (
		<VStack spacing="4" className="jp-forms__gsheets-sync">
			<p className="integration-card__description">
				{ __(
					'Send each new response to a Google Spreadsheet, as well as keeping it here.',
					'jetpack-forms'
				) }
			</p>

			<VStack spacing="3">
				<RadioControl
					label={ __( 'Spreadsheet', 'jetpack-forms' ) }
					selected={ mode }
					options={ [
						{ label: __( 'Create a new spreadsheet', 'jetpack-forms' ), value: 'create' },
						{ label: __( 'Use an existing spreadsheet', 'jetpack-forms' ), value: 'existing' },
					] }
					onChange={ setMode }
				/>

				{ /* Indented so it reads as belonging to the option above it rather
				     than as a further choice of its own. */ }
				{ mode === 'existing' && (
					<div className="jp-forms__gsheets-sync__suboption">
						<TextControl
							label={ __( 'Spreadsheet link', 'jetpack-forms' ) }
							help={ __(
								'Paste the link to a Google Sheet you own. Its existing content is left untouched — new responses are added below it.',
								'jetpack-forms'
							) }
							value={ spreadsheetUrl }
							onChange={ setSpreadsheetUrl }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</div>
				) }
			</VStack>

			{ /* Separated from the radio group so it does not read as a third
			     option there. Only offered for a new spreadsheet: an existing one
			     is left untouched, so there is nowhere to seed. */ }
			{ mode === 'create' && (
				<CheckboxControl
					label={ __( 'Include responses you already have', 'jetpack-forms' ) }
					help={ __(
						'Copies the responses collected so far into the spreadsheet before syncing begins.',
						'jetpack-forms'
					) }
					checked={ backfill }
					onChange={ setBackfill }
					__nextHasNoMarginBottom={ true }
				/>
			) }

			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }

			<div>
				<Button
					variant="primary"
					onClick={ handleSetup }
					disabled={ ! canSubmit }
					isBusy={ isSettingUp }
					__next40pxDefaultSize={ true }
				>
					{ __( 'Set up syncing', 'jetpack-forms' ) }
				</Button>
			</div>
		</VStack>
	);
}
