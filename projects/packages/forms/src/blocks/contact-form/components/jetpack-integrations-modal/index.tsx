/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Modal, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import AkismetCard from './akismet-card';
import CreativeMailCard from './creative-mail-card';
import GoogleSheetsCard from './google-sheets-card';
import JetpackCRMCard from './jetpack-crm-card';
import MailPoetCard from './mailpoet-card';
import PluginIntegrationCard from './plugin-integration-card';
import SalesforceCard from './salesforce-card';
import ServiceIntegrationCard from './service-integration-card';
import './style.scss';
/**
 * Types
 */
import type { Integration } from '../../../../types';

const IntegrationsModal = ( {
	isOpen,
	onClose,
	attributes,
	setAttributes,
	integrationsData,
	refreshIntegrations,
} ) => {
	const [ expandedCards, setExpandedCards ] = useState( {} );

	if ( ! isOpen ) {
		return null;
	}

	const toggleCard = ( cardId: string ) => {
		setExpandedCards( prev => {
			const isExpanding = ! prev[ cardId ];

			if ( isExpanding ) {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_integrations_card_expand', {
					card: cardId,
					origin: 'block-editor',
				} );
			}

			return {
				...prev,
				[ cardId ]: isExpanding,
			};
		} );
	};

	return (
		<Modal
			title={ __( 'Manage integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			style={ { width: '700px' } }
			className="jetpack-forms-integrations-modal"
		>
			<VStack spacing="4">
				{ integrationsData &&
					integrationsData.map( ( integration: Integration, index: number ) => {
						const commonProps = {
							key: integration.id,
							isExpanded: !! expandedCards[ integration.id ],
							onToggle: () => toggleCard( integration.id ),
							data: integration,
							refreshStatus: refreshIntegrations,
							borderBottom: index < integrationsData.length - 1,
						};

						// Use specific components for known integrations
						switch ( integration.id ) {
							case 'akismet':
								return <AkismetCard { ...commonProps } />;
							case 'google-drive':
								return <GoogleSheetsCard { ...commonProps } />;
							case 'zero-bs-crm':
								return (
									<JetpackCRMCard
										{ ...commonProps }
										jetpackCRM={ attributes.jetpackCRM }
										setAttributes={ setAttributes }
									/>
								);
							case 'mailpoet':
								return (
									<MailPoetCard
										{ ...commonProps }
										mailpoet={ attributes.mailpoet }
										setAttributes={ setAttributes }
									/>
								);
							case 'salesforce':
								return (
									<SalesforceCard
										{ ...commonProps }
										salesforceData={ attributes.salesforceData }
										setAttributes={ setAttributes }
									/>
								);
							case 'creative-mail-by-constant-contact':
								return <CreativeMailCard { ...commonProps } />;
							default:
								// Use generic components for new/unknown integrations
								if ( integration.type === 'service' ) {
									return (
										<ServiceIntegrationCard
											integration={ integration }
											isExpanded={ !! expandedCards[ integration.id ] }
											onToggle={ () => toggleCard( integration.id ) }
											borderBottom={ index < integrationsData.length - 1 }
											attributes={ attributes }
											setAttributes={ setAttributes }
											refreshIntegrations={ refreshIntegrations }
										/>
									);
								}

								return (
									<PluginIntegrationCard
										integration={ integration }
										isExpanded={ !! expandedCards[ integration.id ] }
										onToggle={ () => toggleCard( integration.id ) }
										borderBottom={ index < integrationsData.length - 1 }
										refreshIntegrations={ refreshIntegrations }
									/>
								);
						}
					} ) }
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
