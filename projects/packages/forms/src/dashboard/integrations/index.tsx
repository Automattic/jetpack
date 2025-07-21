/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useIntegrationsStatus } from '../../blocks/contact-form/components/jetpack-integrations-modal/hooks/use-integrations-status';
import { config } from '../index';
import AkismetDashboardCard from './akismet-card';
import CreativeMailDashboardCard from './creative-mail-card';
import GoogleSheetsDashboardCard from './google-sheets-card';
import JetpackCRMDashboardCard from './jetpack-crm-card';
import MailPoetDashboardCard from './mailpoet-card';
import SalesforceDashboardCard from './salesforce-card';
import './style.scss';
/**
 * Types
 */
import type { Integration } from '../../types';

const Integrations = () => {
	const { integrations, refreshIntegrations } = useIntegrationsStatus();
	const [ expandedCards, setExpandedCards ] = useState( {
		akismet: false,
		googleSheets: false,
		crm: false,
		creativemail: false,
		salesforce: false,
		mailpoet: false,
	} );

	const isMailpoetEnabled = config( 'isMailpoetEnabled' );

	const toggleCard = useCallback( ( cardId: keyof typeof expandedCards ) => {
		setExpandedCards( prev => {
			const isExpanding = ! prev[ cardId ];

			if ( isExpanding ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_card_expand', {
					card: cardId,
					origin: 'dashboard',
				} );
			}

			return {
				...prev,
				[ cardId ]: isExpanding,
			};
		} );
	}, [] );

	const handleToggleAkismet = useCallback( () => toggleCard( 'akismet' ), [ toggleCard ] );
	const handleToggleGoogleSheets = useCallback(
		() => toggleCard( 'googleSheets' ),
		[ toggleCard ]
	);
	const handleToggleCRM = useCallback( () => toggleCard( 'crm' ), [ toggleCard ] );
	const handleToggleSalesforce = useCallback( () => toggleCard( 'salesforce' ), [ toggleCard ] );
	const handleToggleCreativeMail = useCallback(
		() => toggleCard( 'creativemail' ),
		[ toggleCard ]
	);
	const handleToggleMailPoet = useCallback( () => toggleCard( 'mailpoet' ), [ toggleCard ] );

	const findIntegrationById = ( id: string ) =>
		integrations?.find( ( integration: Integration ) => integration.id === id );

	return (
		<div className="jp-forms__integrations">
			<div className="jp-forms__integrations-wrapper">
				<div className="jp-forms__integrations-header">
					<h2 className="jp-forms__integrations-header-heading">
						{ __( 'Streamline your forms', 'jetpack-forms' ) }
					</h2>
					<div className="jp-forms__integrations-header-description">
						{ __(
							'Manage integrations for all forms on your site. You can turn them on or off per form in the editor.',
							'jetpack-forms'
						) }
					</div>
				</div>
				<div className="jp-forms__integrations-body">
					<AkismetDashboardCard
						isExpanded={ expandedCards.akismet }
						onToggle={ handleToggleAkismet }
						data={ findIntegrationById( 'akismet' ) }
						refreshStatus={ refreshIntegrations }
					/>
					<GoogleSheetsDashboardCard
						isExpanded={ expandedCards.googleSheets }
						onToggle={ handleToggleGoogleSheets }
						data={ findIntegrationById( 'google-drive' ) }
						refreshStatus={ refreshIntegrations }
					/>
					<JetpackCRMDashboardCard
						isExpanded={ expandedCards.crm }
						onToggle={ handleToggleCRM }
						data={ findIntegrationById( 'zero-bs-crm' ) }
						refreshStatus={ refreshIntegrations }
					/>
					{ isMailpoetEnabled && (
						<MailPoetDashboardCard
							isExpanded={ expandedCards.mailpoet }
							onToggle={ handleToggleMailPoet }
							data={ findIntegrationById( 'mailpoet' ) }
							refreshStatus={ refreshIntegrations }
						/>
					) }
					<SalesforceDashboardCard
						isExpanded={ expandedCards.salesforce }
						onToggle={ handleToggleSalesforce }
						data={ findIntegrationById( 'salesforce' ) }
						refreshStatus={ refreshIntegrations }
					/>
					<CreativeMailDashboardCard
						isExpanded={ expandedCards.creativemail }
						onToggle={ handleToggleCreativeMail }
						data={ findIntegrationById( 'creative-mail-by-constant-contact' ) }
						refreshStatus={ refreshIntegrations }
						borderBottom={ false }
					/>
				</div>
			</div>
		</div>
	);
};

export default Integrations;
