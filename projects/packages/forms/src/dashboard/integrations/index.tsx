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
import AkismetCard from './akismet-card';
import CreativeMailCard from './creative-mail-card';
import GoogleSheetsCard from './google-sheets-card';
import JetpackCRMCard from './jetpack-crm-card';
import MailPoetCard from './mailpoet-card';
import PluginDashboardIntegrationCard from './plugin-integration-card';
import SalesforceCard from './salesforce-card';
import ServiceDashboardIntegrationCard from './service-integration-card';
import './style.scss';
/**
 * Types
 */
import type { Integration } from '../../types';

const Integrations = () => {
	const { integrations, refreshIntegrations } = useIntegrationsStatus();
	const [ expandedCards, setExpandedCards ] = useState( {} );

	const toggleCard = useCallback( ( cardId: string ) => {
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
					{ integrations &&
						integrations.map( ( integration: Integration, index: number ) => {
							const commonProps = {
								key: integration.id,
								isExpanded: !! expandedCards[ integration.id ],
								onToggle: () => toggleCard( integration.id ),
								data: integration,
								refreshStatus: refreshIntegrations,
								borderBottom: index < integrations.length - 1,
							};

							// Use specific components for known integrations
							switch ( integration.id ) {
								case 'akismet':
									return <AkismetCard { ...commonProps } />;
								case 'google-drive':
									return <GoogleSheetsCard { ...commonProps } />;
								case 'zero-bs-crm':
									return <JetpackCRMCard { ...commonProps } />;
								case 'mailpoet':
									return <MailPoetCard { ...commonProps } />;
								case 'salesforce':
									return <SalesforceCard { ...commonProps } />;
								case 'creative-mail-by-constant-contact':
									return <CreativeMailCard { ...commonProps } />;
								default:
									// Use generic components for new/unknown integrations
									if ( integration.type === 'service' ) {
										return <ServiceDashboardIntegrationCard { ...commonProps } />;
									}
									return <PluginDashboardIntegrationCard { ...commonProps } />;
							}
						} ) }
				</div>
			</div>
		</div>
	);
};

export default Integrations;
