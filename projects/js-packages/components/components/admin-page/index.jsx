/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import JetpackFooter from '../jetpack-footer';
import JetpackLogo from '../jetpack-logo';
import Container from '../layout/container';
import Col from '../layout/col';

/**
 * This is the base structure for any admin page. It comes with Header and Footer.
 *
 * All content must be passed as children wrapped in as many <AdminSection> elements as needed.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminPage component.
 */
const AdminPage = props => {
	const { children, moduleName, a8cLogoHref, showHeader, showFooter, showBackground } = props;
	const rootClassName = classNames( styles[ 'admin-page' ], {
		[ styles.background ]: showBackground,
	} );

	return (
		<div className={ rootClassName }>
			{ showHeader && (
				<Container horizontalSpacing={ 5 }>
					<Col>
						<JetpackLogo />
					</Col>
				</Container>
			) }
			<Container fluid horizontalSpacing={ 0 }>
				<Col>{ children }</Col>
			</Container>
			{ showFooter && (
				<Container horizontalSpacing={ 5 }>
					<Col>
						<JetpackFooter moduleName={ moduleName } a8cLogoHref={ a8cLogoHref } />
					</Col>
				</Container>
			) }
		</div>
	);
};

AdminPage.defaultProps = {
	a8cLogoHref: 'https://jetpack.com',
	moduleName: __( 'Jetpack', 'jetpack' ),
	showHeader: true,
	showFooter: true,
	showBackground: true,
};

AdminPage.propTypes = {
	/** Link for 'An Automattic Airline' in the footer. */
	a8cLogoHref: PropTypes.string,
	/** Name of the module, e.g. 'Jetpack Search' that will be displayed in the footer. */
	moduleName: PropTypes.string,
	/** Whether or not to display the Header */
	showHeader: PropTypes.bool,
	/** Whether or not to display the Footer */
	showFooter: PropTypes.bool,
	/** Whether or not to display the Background Color */
	showBackground: PropTypes.bool,
};

export default AdminPage;
