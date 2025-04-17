// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { Modal, __experimentalVStack as VStack } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AkismetCard from './akismet-card';
import CreativeMailCard from './creative-mail-card';
import JetpackCRMCard from './jetpack-crm-card';

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

	return (
		<Modal
			title={ __( 'Manage integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			style={ { width: '700px' } }
		>
			<VStack spacing="4">
				<AkismetCard
					isExpanded={ expandedCards.akismet }
					onToggle={ () => toggleCard( 'akismet' ) }
					data={ integrationsData?.akismet }
					refreshStatus={ refreshIntegrations }
				/>
				<JetpackCRMCard
					isExpanded={ expandedCards.crm }
					onToggle={ () => toggleCard( 'crm' ) }
					jetpackCRM={ attributes.jetpackCRM }
					setAttributes={ setAttributes }
					data={ integrationsData?.[ 'zero-bs-crm' ] }
					refreshStatus={ refreshIntegrations }
				/>
				<CreativeMailCard
					isExpanded={ expandedCards.creativemail }
					onToggle={ () => toggleCard( 'creativemail' ) }
					data={ integrationsData?.[ 'creative-mail-by-constant-contact' ] }
					refreshStatus={ refreshIntegrations }
				/>
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
