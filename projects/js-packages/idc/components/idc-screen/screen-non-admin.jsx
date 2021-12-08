/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import customContentShape from '../../tools/custom-content-shape';

/**
 * Retrieve the main screen body.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The ScreenMain component.
 */
const ScreenNonAdmin = props => {
	const { customContent } = props;

	return (
		<React.Fragment>
			<h2>{ customContent.nonAdminTitle || __( 'Safe Mode has been activated', 'jetpack' ) }</h2>

			<p>
				{ customContent.nonAdminBodyText ||
					createInterpolateElement(
						__(
							'Your site is in Safe Mode because you have 2 Jetpack-powered sites that appear to be duplicates. ' +
								'2 sites that are telling Jetpack they’re the same site. <safeModeLink>Learn more about safe mode.</safeModeLink>',
							'jetpack'
						),
						{
							safeModeLink: (
								<a
									href={ getRedirectUrl( 'jetpack-support-safe-mode' ) }
									rel="noopener noreferrer"
									target="_blank"
								/>
							),
						}
					) }
			</p>

			{ customContent.nonAdminBodyText ? (
				''
			) : (
				<p>
					{ __( 'An administrator of this site can take Jetpack out of Safe Mode.', 'jetpack' ) }
				</p>
			) }
		</React.Fragment>
	);
};

ScreenNonAdmin.propTypes = {
	/** Custom text content. */
	customContent: PropTypes.shape( customContentShape ),
};

ScreenNonAdmin.defaultProps = {
	customContent: {},
};

export default ScreenNonAdmin;
