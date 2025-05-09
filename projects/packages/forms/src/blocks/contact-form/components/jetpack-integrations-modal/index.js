// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { Modal, __experimentalVStack as VStack } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AkismetCard from './akismet-card';
import CreativeMailCard from './creative-mail-card';
import JetpackCRMCard from './jetpack-crm-card';
import SalesforceCard from './salesforce-card';
import './style.scss';

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
		crm: false,
		creativemail: false,
		salesforce: false,
	} );

	if ( ! isOpen ) {
		return null;
	}

	const toggleCard = cardId => {
		setExpandedCards( prev => ( {
			...prev,
			[ cardId ]: ! prev[ cardId ],
		} ) );
	};

	const findIntegrationById = id => integrationsData?.find( integration => integration.id === id );

	return (
		<Modal
			title={ __( 'Manage integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			style={ { width: '700px' } }
			className="jetpack-forms-integrations-modal"
		>
			<VStack spacing="4">
				<AkismetCard
					isExpanded={ expandedCards.akismet }
					onToggle={ () => toggleCard( 'akismet' ) }
					data={ findIntegrationById( 'akismet' ) }
					refreshStatus={ refreshIntegrations }
				/>
				<JetpackCRMCard
					isExpanded={ expandedCards.crm }
					onToggle={ () => toggleCard( 'crm' ) }
					jetpackCRM={ attributes.jetpackCRM }
					setAttributes={ setAttributes }
					data={ findIntegrationById( 'zero-bs-crm' ) }
					refreshStatus={ refreshIntegrations }
				/>
				<SalesforceCard
					isExpanded={ expandedCards.salesforce }
					onToggle={ () => toggleCard( 'salesforce' ) }
					data={ findIntegrationById( 'salesforce' ) }
					refreshStatus={ refreshIntegrations }
					salesforceData={ attributes.salesforceData }
					setAttributes={ setAttributes }
				/>
				<CreativeMailCard
					isExpanded={ expandedCards.creativemail }
					onToggle={ () => toggleCard( 'creativemail' ) }
					data={ findIntegrationById( 'creative-mail-by-constant-contact' ) }
					refreshStatus={ refreshIntegrations }
					borderBottom={ false }
				/>
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
