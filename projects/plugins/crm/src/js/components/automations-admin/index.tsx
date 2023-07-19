import { AdminSection } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React from 'react';
import AdminPage from '../admin-page';

export const AutomationsAdmin = () => {
	return (
		<AdminPage
			headline={ __( 'Automations', 'zero-bs-crm' ) }
			subHeadline={ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
			children={ <AdminSection>{ /* Page content goes here in the future. */ }</AdminSection> }
		/>
	);
};
