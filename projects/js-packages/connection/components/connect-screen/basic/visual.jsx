/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ConnectScreenLayout from '../layout';
import './style.scss';

export const ToS = createInterpolateElement(
	__(
		'By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
		'jetpack'
	),
	{
		tosLink: <a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />,
		shareDetailsLink: (
			<a
				href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
				rel="noopener noreferrer"
				target="_blank"
			/>
		),
	}
);

/**
 * The Connection Screen Visual component..
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreenRequiredPlanVisual` component.
 */
const ConnectScreenVisual = props => {
	const { title, images, children, assetBaseUrl, isLoading } = props;

	return (
		<ConnectScreenLayout
			title={ title }
			assetBaseUrl={ assetBaseUrl }
			images={ images }
			className={
				'jp-connection__connect-screen' +
				( isLoading ? ' jp-connection__connect-screen__loading' : '' )
			}
		>
			<div className="jp-connection__connect-screen__content">
				{ children }

				<div className="jp-connection__connect-screen__tos">{ ToS }</div>
			</div>
		</ConnectScreenLayout>
	);
};

ConnectScreenVisual.propTypes = {
	/** The Title. */
	title: PropTypes.string,
	/** Images to display on the right side. */
	images: PropTypes.arrayOf( PropTypes.string ),
	/** The assets base URL. */
	assetBaseUrl: PropTypes.string,
	/** Whether the connection status is still loading. */
	isLoading: PropTypes.bool.isRequired,
};

export default ConnectScreenVisual;
