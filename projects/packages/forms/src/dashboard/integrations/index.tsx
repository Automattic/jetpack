import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
import { useIntegrationsStatus } from '../../blocks/contact-form/components/jetpack-integrations-modal/hooks/useIntegrationsStatus';
import AkismetDashboardCard from './akismet-card';
import CreativeMailDashboardCard from './creative-mail-card';
import GoogleSheetsDashboardCard from './google-sheets-card';
import JetpackCRMDashboardCard from './jetpack-crm-card';
import SalesforceDashboardCard from './salesforce-card';
import './style.scss';
import type { Integration } from './types';

const Integrations = () => {
	const { integrations, refreshIntegrations } = useIntegrationsStatus();
	const [ expandedCards, setExpandedCards ] = useState( {
		akismet: false,
		googleSheets: false,
		crm: false,
		creativemail: false,
		salesforce: false,
	} );

	const toggleCard = useCallback( ( cardId: keyof typeof expandedCards ) => {
		setExpandedCards( prev => ( {
			...prev,
			[ cardId ]: ! prev[ cardId ],
		} ) );
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
