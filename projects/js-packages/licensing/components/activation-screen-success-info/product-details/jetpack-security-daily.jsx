/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * The Jetpack Security Daily Product Details component.
 *
 * @param {object} props -- The properties.
 * @param {number} props.dashboardUrl -- The url that links to the site dashboard
 * @returns {React.Component} The `JetpackBackupDailyProductDetails` component.
 */
const JetpackSecurityDailyProductDetails = props => {
	const { dashboardUrl } = props;
	return (
		<div>
			<h1>
				{ __( 'Your Jetpack Daily Security is active!', 'jetpack' ) }{ ' ' }
				{ String.fromCodePoint( 0x1f389 ) }
				{ /* Celebration emoji 🎉 */ }
			</h1>
			<p>
				{ createInterpolateElement(
					__( 'You can scan and fix your site on <a>cloud.jetpack.com</a>.', 'jetpack' ),
					{
						a: <a href={ dashboardUrl } />,
					}
				) }
			</p>
		</div>
	);
};

JetpackSecurityDailyProductDetails.PropTypes = {
	dashboardUrl: PropTypes.string,
};

export default JetpackSecurityDailyProductDetails;
