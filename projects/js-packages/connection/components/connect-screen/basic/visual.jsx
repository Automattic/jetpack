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

/**
 * The Connection Screen Visual component..
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreenRequiredPlanVisual` component.
 */
const ConnectScreenVisual = props => {
	const {
		title,
		buttonLabel,
		images,
		children,
		assetBaseUrl,
		autoTrigger,
		connectionStatus,
		renderConnectBtn,
	} = props;

	const tos = createInterpolateElement(
		__(
			'By clicking the button above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
			'jetpack'
		),
		{
			tosLink: (
				<a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />
			),
			shareDetailsLink: (
				<a
					href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
					rel="noopener noreferrer"
					target="_blank"
				/>
			),
		}
	);

	return (
		<ConnectScreenLayout
			title={ title }
			assetBaseUrl={ assetBaseUrl }
			images={ images }
			className={
				'jp-connection__connect-screen' +
				( connectionStatus.hasOwnProperty( 'isRegistered' )
					? ''
					: ' jp-connection__connect-screen__loading' )
			}
		>
			<div className="jp-connection__connect-screen__content">
				{ children }

				{ renderConnectBtn( buttonLabel, autoTrigger ) }

				<div className="jp-connection__connect-screen__tos">{ tos }</div>
			</div>
		</ConnectScreenLayout>
	);
};

ConnectScreenVisual.propTypes = {
	/** The Title. */
	title: PropTypes.string,
	/** The Connect Button label. */
	buttonLabel: PropTypes.string,
	/** Connection Status object */
	connectionStatus: PropTypes.object.isRequired,
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger: PropTypes.bool,
	/** Connect button render function */
	renderConnectBtn: PropTypes.func.isRequired,
};

ConnectScreenVisual.defaultProps = {
	autoTrigger: false,
};

export default ConnectScreenVisual;
