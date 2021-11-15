/**
 * External dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
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
				{
					sprintf(
						/* translators: "%s" is a is Celebration emoji 🎉. */
						__( 'Your Jetpack Daily Backup is active! %s', 'jetpack' ),
						String.fromCodePoint( 0x1f389 )
					)
				}
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
