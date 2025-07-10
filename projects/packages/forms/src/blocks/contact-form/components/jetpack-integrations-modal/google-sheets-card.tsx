import { Button, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import GoogleSheetsIcon from '../../../../icons/google-sheets';
import IntegrationCard from './integration-card';
import type { SingleIntegrationCardProps } from '../../../../types';

const FORM_RESPONSES_URL =
	window?.jpFormsBlocks?.defaults?.formsResponsesUrl ||
	'/wp-admin/admin.php?page=jetpack-forms-admin';

const GoogleSheetsCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
}: SingleIntegrationCardProps ) => {
	const [ isPolling, setIsPolling ] = useState( false );
	const pollInterval = useRef< ReturnType< typeof setInterval > | null >( null );
	const isConnected = !! data?.isConnected;
	const settingsUrl = data?.settingsUrl as string | undefined;

	const cardData = {
		...data,
		slug: 'google-sheets',
		showHeaderToggle: false,
		isLoading: ! data,
		refreshStatus,
		trackEventName: 'jetpack_forms_upsell_googledrive_click',
		isActive: !! data?.isConnected,
	};

	const handleConnectClick = useCallback( () => {
		if ( ! settingsUrl ) return;
		window.open( settingsUrl, '_blank', 'noopener,noreferrer' );
		setIsPolling( true );
	}, [ settingsUrl ] );

	// Poll for connection status when polling is active
	useEffect( () => {
		if ( isPolling && ! isConnected ) {
			pollInterval.current = setInterval( () => {
				refreshStatus && refreshStatus();
			}, 5000 );
			return () => {
				if ( pollInterval.current ) {
					clearInterval( pollInterval.current );
				}
			};
		}
		if ( isConnected && pollInterval.current ) {
			clearInterval( pollInterval.current );
			setIsPolling( false );
		}
		return () => {
			if ( pollInterval.current ) {
				clearInterval( pollInterval.current );
				setIsPolling( false );
			}
		};
	}, [ isPolling, isConnected, refreshStatus ] );

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
						<Button
							variant="link"
							href={ FORM_RESPONSES_URL }
							target="_blank"
							rel="noopener noreferrer"
						>
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

export default GoogleSheetsCard;
