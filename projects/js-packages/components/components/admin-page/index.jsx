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
import JetpackAdminPageHeader from './header';
import JetpackAdminPageFooter from './footer';

/**
 * This is the base structure for any admin page. It comes with Header and Footer.
 *
 * All content must be passed as children wrapped in as many <JetpackAdminSection> elements as needed.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} JetpackAdminPage component.
 */
const JetpackAdminPage = props => {
	const { children, moduleName, a8cLogoHref } = props;

	return (
		<div class="jp-admin-page">
			<JetpackAdminPageHeader />
			{ children }
			<JetpackAdminPageFooter moduleName={ moduleName } a8cLogoHref={ a8cLogoHref } />
		</div>
	);
};

JetpackAdminPage.defaultProps = {
	a8cLogoHref: 'https://jetpack.com',
	moduleName: __( 'Jetpack', 'jetpack' ),
};

JetpackAdminPage.propTypes = {
	/** Link for 'An Automattic Airline' in the footer. */
	a8cLogoHref: PropTypes.string,
	/** Name of the module, e.g. 'Jetpack Search' that will be displayed in the footer. */
	moduleName: PropTypes.string,
};

export default JetpackAdminPage;
