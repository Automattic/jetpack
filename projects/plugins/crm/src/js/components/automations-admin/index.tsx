import { __ } from '@wordpress/i18n';

import './styles.scss';

export const AutomationsAdmin = () => {
	return (
		<div className="jpcrm-automations-admin__container">
			<h1>{ __( 'Automations', 'zero-bs-crm' ) }</h1>
			<div className="jpcrm-automations-admin__subheader">
				{ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
			</div>
		</div>
	);
};
