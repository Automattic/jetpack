/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';
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
	const { children, moduleName, a8cLogoHref } = props;

	return (
		<div class="jp-admin-page">
			<AdminPageHeader />
			{ children }
			<AdminPageFooter moduleName={ moduleName } a8cLogoHref={ a8cLogoHref } />
		</div>
	);
};

AdminPage.defaultProps = {
	a8cLogoHref: 'https://jetpack.com',
	moduleName: __( 'Jetpack', 'jetpack' ),
};

AdminPage.propTypes = {
	/** Link for 'An Automattic Airline' in the footer. */
	a8cLogoHref: PropTypes.string,
	/** Name of the module, e.g. 'Jetpack Search' that will be displayed in the footer. */
	moduleName: PropTypes.string,
};

export default AdminPage;
