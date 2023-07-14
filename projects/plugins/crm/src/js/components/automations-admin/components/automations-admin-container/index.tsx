import { __ } from '@wordpress/i18n';
import React from 'react';
import styles from './styles.module.scss';

export const AutomationsAdminContainer: React.FC< React.PropsWithChildren > = props => {
	const { children } = props;

	return (
		<>
			<div className={ styles.container }>
				<h1>{ __( 'Automations', 'zero-bs-crm' ) }</h1>
				<div className={ styles.subheader }>
					{ __( 'Streamline your workflows with CRM Automations', 'zero-bs-crm' ) }
				</div>
				{ children }
			</div>
		</>
	);
};
