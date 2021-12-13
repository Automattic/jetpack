/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import AdminPageHeader from './header';
import AdminPageFooter from './footer';

/**
 * This is the base structure for any admin page. It comes with Header and Footer.
 *
 * All content must be passed as children wrapped in as many <AdminSection> elements as needed.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} AdminPage component.
 */
const AdminPage = props => {
	const { children, moduleName, a8cLogoHref, showHeader, showFooter } = props;

	return (
		<div className={ styles[ 'jp-admin-page' ] }>
			{ showHeader && <AdminPageHeader /> }
			{ children }
			{ showFooter && <AdminPageFooter moduleName={ moduleName } a8cLogoHref={ a8cLogoHref } /> }
		</div>
	);
};

AdminPage.defaultProps = {
	a8cLogoHref: 'https://jetpack.com',
	moduleName: __( 'Jetpack', 'jetpack' ),
	showHeader: true,
	showFooter: true,
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
};

export default AdminPage;
