import { Modal } from '@wordpress/components';
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
			title={ __( 'Manage Integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			style={ { width: '700px' } }
		>
			<div style={ { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' } }>
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
					data={ integrationsData?.[ 'jetpack-crm' ] }
					refreshStatus={ refreshIntegrations }
				/>
				<CreativeMailCard
					isExpanded={ expandedCards.creativemail }
					onToggle={ () => toggleCard( 'creativemail' ) }
					data={ integrationsData?.[ 'creative-mail' ] }
					refreshStatus={ refreshIntegrations }
				/>
			</div>
		</Modal>
	);
};

export default IntegrationsModal;
