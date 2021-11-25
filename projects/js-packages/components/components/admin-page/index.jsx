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
import JetpackLogo from '../jetpack-logo';
import JetpackFooter from '../jetpack-footer';

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
		<>
			<div className="jp-admin-page-section">
				<div className="jp-wrap">
					<div class="jp-row">
						<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">
							<JetpackLogo />
						</div>
					</div>
				</div>
			</div>
			{ children }
			<div className="jp-admin-page-section">
				<div className="jp-wrap">
					<div class="jp-row">
						<div class="lg-col-span-12 md-col-span-8 sm-col-span-4">
							<JetpackFooter moduleName={ moduleName } a8cLogoHref={ a8cLogoHref } />
						</div>
					</div>
				</div>
			</div>
		</>
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
