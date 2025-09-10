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
import SalesforceCard from './salesforce-card';
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
	const [ expandedCards, setExpandedCards ] = useState( {
		akismet: false,
		googleSheets: false,
		crm: false,
		creativemail: false,
		salesforce: false,
		mailpoet: false,
	} );

	if ( ! isOpen ) {
		return null;
	}

	const findIntegrationById = ( id: string ) =>
		integrationsData?.find( ( integration: Integration ) => integration.id === id );

	// Only supported integrations will be returned from endpoint.
	const akismetData = findIntegrationById( 'akismet' );
	const googleDriveData = findIntegrationById( 'google-drive' );
	const crmData = findIntegrationById( 'zero-bs-crm' );
	const mailpoetData = findIntegrationById( 'mailpoet' );
	const salesforceData = findIntegrationById( 'salesforce' );
	const creativeMailData = findIntegrationById( 'creative-mail-by-constant-contact' );

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
				{ akismetData && (
					<AkismetCard
						isExpanded={ expandedCards.akismet }
						onToggle={ () => toggleCard( 'akismet' ) }
						data={ akismetData }
						refreshStatus={ refreshIntegrations }
					/>
				) }
				{ googleDriveData && (
					<GoogleSheetsCard
						isExpanded={ expandedCards.googleSheets }
						onToggle={ () => toggleCard( 'googleSheets' ) }
						data={ googleDriveData }
						refreshStatus={ refreshIntegrations }
					/>
				) }
				{ crmData && (
					<JetpackCRMCard
						isExpanded={ expandedCards.crm }
						onToggle={ () => toggleCard( 'crm' ) }
						jetpackCRM={ attributes.jetpackCRM }
						setAttributes={ setAttributes }
						data={ crmData }
						refreshStatus={ refreshIntegrations }
					/>
				) }
				{ mailpoetData && (
					<MailPoetCard
						isExpanded={ expandedCards.mailpoet }
						onToggle={ () => toggleCard( 'mailpoet' ) }
						data={ mailpoetData }
						refreshStatus={ refreshIntegrations }
						mailpoet={ attributes.mailpoet }
						setAttributes={ setAttributes }
					/>
				) }
				{ salesforceData && (
					<SalesforceCard
						isExpanded={ expandedCards.salesforce }
						onToggle={ () => toggleCard( 'salesforce' ) }
						data={ salesforceData }
						refreshStatus={ refreshIntegrations }
						salesforceData={ attributes.salesforceData }
						setAttributes={ setAttributes }
					/>
				) }
				{ creativeMailData && (
					<CreativeMailCard
						isExpanded={ expandedCards.creativemail }
						onToggle={ () => toggleCard( 'creativemail' ) }
						data={ creativeMailData }
						refreshStatus={ refreshIntegrations }
						borderBottom={ false }
					/>
				) }
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
