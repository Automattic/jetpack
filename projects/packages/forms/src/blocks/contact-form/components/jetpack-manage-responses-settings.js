import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import InspectorHint from '../components/inspector-hint';
import JetpackIntegrationsModal from './jetpack-integrations-modal';

const RESPONSES_PATH = `${ get( getJetpackData(), 'adminUrl', false ) }edit.php?post_type=feedback`;

const JetpackManageResponsesSettings = ( { setAttributes, attributes } ) => {
	const [ isIntegrationsModalOpen, setIsIntegrationsModalOpen ] = useState( false );

	return (
		<>
			<InspectorHint>
				{ __( 'Manage and export your form responses in WPAdmin:', 'jetpack-forms' ) }
			</InspectorHint>
			<Button variant="secondary" href={ RESPONSES_PATH } target="_blank">
				{ __( 'View Form Responses', 'jetpack-forms' ) }
				<span className="screen-reader-text">
					{ __( '(opens in a new tab)', 'jetpack-forms' ) }
				</span>
			</Button>
			<Button
				variant="secondary"
				onClick={ () => setIsIntegrationsModalOpen( true ) }
				className="jetpack-forms-integrations-panel"
				style={ { marginTop: '8px' } }
			>
				{ __( 'Manage Integrations', 'jetpack-forms' ) }
			</Button>
			<JetpackIntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ () => setIsIntegrationsModalOpen( false ) }
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
};

export default JetpackManageResponsesSettings;
