import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFooter from '../jetpack-footer';
import JetpackLogo from '../jetpack-logo';
import Col from '../layout/col';
import Container from '../layout/container';
import styles from './style.module.scss';
import type { AdminPageProps } from './types';
import type React from 'react';

/**
 * This is the base structure for any admin page. It comes with Header and Footer.
 *
 * All content must be passed as children wrapped in as many <AdminSection> elements as needed.
 *
 * @param {AdminPageProps} props - Component properties.
 * @returns {React.ReactNode} AdminPage component.
 */
const AdminPage: React.FC< AdminPageProps > = ( {
	children,
	moduleName = __( 'Jetpack', 'jetpack' ),
	moduleNameHref,
	showHeader = true,
	showFooter = true,
	showBackground = true,
	header,
} ) => {
	const rootClassName = clsx( styles[ 'admin-page' ], {
		[ styles.background ]: showBackground,
	} );

	return (
		<div className={ rootClassName }>
			{ showHeader && (
				<Container horizontalSpacing={ 5 }>
					<Col>{ header ? header : <JetpackLogo /> }</Col>
				</Container>
			) }
			<Container fluid horizontalSpacing={ 0 }>
				<Col>{ children }</Col>
			</Container>
			{ showFooter && (
				<Container horizontalSpacing={ 5 }>
					<Col>
						<JetpackFooter moduleName={ moduleName } moduleNameHref={ moduleNameHref } />
					</Col>
				</Container>
			) }
		</div>
	);
};

export default AdminPage;
