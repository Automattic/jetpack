/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from 'react';
/**
 * Internal dependencies
 */
import { INTEGRATIONS_STORE } from '../../store/integrations';
import AkismetDashboardCard from './akismet-card';
import GoogleSheetsDashboardCard from './google-sheets-card';
import HostingerReachDashboardCard from './hostinger-reach-card';
import JetpackCRMDashboardCard from './jetpack-crm-card';
import MailPoetDashboardCard from './mailpoet-card';
import SalesforceDashboardCard from './salesforce-card';
import './style.scss';
/**
 * Types
 */
import type { SelectIntegrations, IntegrationsDispatch } from '../../store/integrations';
import type { Integration } from '../../types';

const EMPTY_ARRAY: Integration[] = [];

const Integrations = () => {
	const { integrations } = useSelect( ( select: SelectIntegrations ) => {
		const store = select( INTEGRATIONS_STORE );
		return {
			integrations: store.getIntegrations() ?? EMPTY_ARRAY,
		};
	}, [] ) as { integrations: Integration[] };
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE ) as IntegrationsDispatch;
	const [ expandedCards, setExpandedCards ] = useState( {
		akismet: false,
		googleSheets: false,
		crm: false,
		salesforce: false,
		mailpoet: false,
		hostingerReach: false,
	} );

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
	const handleToggleMailPoet = useCallback( () => toggleCard( 'mailpoet' ), [ toggleCard ] );
	const handleToggleHostingerReach = useCallback(
		() => toggleCard( 'hostingerReach' ),
		[ toggleCard ]
	);

	const findIntegrationById = ( id: string ) =>
		integrations.find( integration => integration.id === id );

	// Only supported integrations will be returned from endpoint.
	const akismetData = findIntegrationById( 'akismet' );
	const googleDriveData = findIntegrationById( 'google-drive' );
	const crmData = findIntegrationById( 'zero-bs-crm' );
	const mailpoetData = findIntegrationById( 'mailpoet' );
	const salesforceData = findIntegrationById( 'salesforce' );
	const hostingerReachData = findIntegrationById( 'hostinger-reach' );

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
					{ akismetData && (
						<AkismetDashboardCard
							isExpanded={ expandedCards.akismet }
							onToggle={ handleToggleAkismet }
							data={ akismetData }
							refreshStatus={ refreshIntegrations }
						/>
					) }
					{ googleDriveData && (
						<GoogleSheetsDashboardCard
							isExpanded={ expandedCards.googleSheets }
							onToggle={ handleToggleGoogleSheets }
							data={ googleDriveData }
							refreshStatus={ refreshIntegrations }
						/>
					) }
					{ crmData && (
						<JetpackCRMDashboardCard
							isExpanded={ expandedCards.crm }
							onToggle={ handleToggleCRM }
							data={ crmData }
							refreshStatus={ refreshIntegrations }
						/>
					) }
					{ mailpoetData && (
						<MailPoetDashboardCard
							isExpanded={ expandedCards.mailpoet }
							onToggle={ handleToggleMailPoet }
							data={ mailpoetData }
							refreshStatus={ refreshIntegrations }
						/>
					) }
					{ salesforceData && (
						<SalesforceDashboardCard
							isExpanded={ expandedCards.salesforce }
							onToggle={ handleToggleSalesforce }
							data={ salesforceData }
							refreshStatus={ refreshIntegrations }
						/>
					) }
					{ hostingerReachData && (
						<HostingerReachDashboardCard
							isExpanded={ expandedCards.hostingerReach }
							onToggle={ handleToggleHostingerReach }
							data={ hostingerReachData }
							refreshStatus={ refreshIntegrations }
						/>
					) }
				</div>
			</div>
		</div>
	);
};

export default Integrations;
