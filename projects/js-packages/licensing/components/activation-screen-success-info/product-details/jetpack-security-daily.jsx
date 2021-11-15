/**
 * External dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
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
				{ sprintf(
					/* translators: "%s" is a is Celebration emoji 🎉. */
					__( 'Your Jetpack Daily Security is active! %s', 'jetpack' ),
					String.fromCodePoint( 0x1f389 )
				) }
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

JetpackSecurityDailyProductDetails.propTypes = {
	dashboardUrl: PropTypes.string,
};

export default JetpackSecurityDailyProductDetails;
