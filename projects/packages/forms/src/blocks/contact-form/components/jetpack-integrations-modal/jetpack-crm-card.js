import { __ } from '@wordpress/i18n';
import CRMIntegrationSettings from '../jetpack-crm-integration/jetpack-crm-integration-settings';
import IntegrationCard from './integration-card';

const JetpackCRMCard = ( { isExpanded, onToggle, jetpackCRM, setAttributes } ) => {
	return (
		<IntegrationCard
			title={ __( 'Jetpack CRM', 'jetpack-forms' ) }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
		>
			<CRMIntegrationSettings jetpackCRM={ jetpackCRM } setAttributes={ setAttributes } />
		</IntegrationCard>
	);
};

export default JetpackCRMCard;
