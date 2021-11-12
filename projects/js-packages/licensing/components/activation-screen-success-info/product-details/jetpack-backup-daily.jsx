/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * The Jetpack Backup Daily Product Details component.
 *
 * @param {object} props -- The properties.
 * @param {number} props.dashboardUrl -- The url that links to the site dashboard
 * @returns {React.Component} The `JetpackBackupDailyProductDetails` component.
 */
const JetpackBackupDailyProductDetails = props => {
	const { dashboardUrl } = props;
	return (
		<div>
			<h1>
				{ __( 'Your Jetpack Daily Backup is active!', 'jetpack' ) }{ ' ' }
				{ String.fromCodePoint( 0x1f389 ) }
				{ /* Celebration emoji 🎉 */ }
			</h1>
			<p>
				{ createInterpolateElement(
					__(
						'You can see your backups, restore your site on <a>cloud.jetpack.com</a>. If you ever lose access to your site, you can restore it there.',
						'jetpack'
					),
					{
						a: <a href={ dashboardUrl } />,
					}
				) }
			</p>
		</div>
	);
};

JetpackBackupDailyProductDetails.propTypes = {
	dashboardUrl: PropTypes.string,
};

export default JetpackBackupDailyProductDetails;
