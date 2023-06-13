import { AdminPage as JetpackAdminPage, JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';
import type { AdminPageProps } from '@automattic/jetpack-components/components/admin-page/types';
import type React from 'react';

/**
 * This is the base structure for any Jetpack CRM admin page. It comes with Header and Footer.
 *
 * All content must be passed as children wrapped in as many <AdminSection> elements as needed.
 *
 * @param {AdminPageProps} props - Component properties.
 * @returns {React.ReactNode} AdminPage component.
 */
const AdminPage: React.FC< AdminPageProps > = props => {
	const { children } = props;

	return <JetpackAdminPage { ...props }>{ children }</JetpackAdminPage>;
};

/* @todo Replace this when we have a JetpackSearchLogo in the Components library. */
const crmLogo = (
	<div className={ styles[ 'custom-header' ] }>
		<JetpackLogo height={ 40 } />
		<div className={ styles[ 'logo-title' ] }>CRM</div>
	</div>
);

AdminPage.defaultProps = {
	moduleName: __( 'Jetpack CRM', 'zero-bs-crm' ),
	moduleNameHref: 'https://jetpackcrm.com/',
	header: crmLogo,
};

export default AdminPage;
