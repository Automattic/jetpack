/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { ConnectButton, ToS } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The Contextualized Connection component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ContextualizedConnection` component.
 */
const ContextualizedConnection = props => {
	const {
		title,
		logo,
		children,
		className,
		buttonLabel,
		apiRoot,
		apiNonce,
		registrationNonce,
		redirectUri,
		autoTrigger,
		isSiteConnected,
		setHasSeenWCConnectionModal,
	} = props;

	const onConnectionRegistered = useCallback( () => {
		setHasSeenWCConnectionModal( { immediately: false } );
	}, [ setHasSeenWCConnectionModal ] );

	return (
		<div className={ 'jp-contextualized-connection' + ( className ? ' ' + className : '' ) }>
			<div className="jp-contextualized-connection__content">
				<div className="jp-contextualized-connection__logo">{ logo || <JetpackLogo /> }</div>

				<h2>{ title }</h2>

				{ children }

				{ isSiteConnected && (
					<Button
						isPrimary
						className="jp-contextualized-connection__button"
						label={ __( 'Continue to Jetpack', 'jetpack' ) }
						onClick={ setHasSeenWCConnectionModal }
						href="#/dashboard"
					>
						{ __( 'Continue to Jetpack', 'jetpack' ) }
					</Button>
				) }

				{ ! isSiteConnected && (
					<>
						<ConnectButton
							autoTrigger={ autoTrigger }
							apiRoot={ apiRoot }
							apiNonce={ apiNonce }
							registrationNonce={ registrationNonce }
							redirectUri={ redirectUri }
							connectLabel={ buttonLabel }
							onRegistered={ onConnectionRegistered }
						/>
						<div className="jp-contextualized-connection__tos">{ ToS }</div>
					</>
				) }
			</div>

			<footer className="jp-contextualized-connection__footer">
				<div className="jp-contextualized-connection__footer-column">
					<h3>{ __( 'Security tools', 'jetpack' ) }</h3>
					<ul className="jp-contextualized-connection__feature-list">
						<li>
							{ createInterpolateElement(
								__( '<strong>Free</strong> Store Downtime Monitoring', 'jetpack' ),
								{ strong: <strong /> }
							) }
						</li>
						<li>
							{ createInterpolateElement(
								__( '<strong>Free</strong> brute force attack prevention', 'jetpack' ),
								{ strong: <strong /> }
							) }
						</li>
						<li>{ __( 'Full store & order backups', 'jetpack' ) }</li>
						<li>{ __( 'Automated malware scanning', 'jetpack' ) }</li>
						<li>{ __( 'Comment and form spam protection', 'jetpack' ) }</li>
					</ul>
				</div>
				<div className="jp-contextualized-connection__footer-column">
					<h3>{ __( 'Performance tools', 'jetpack' ) }</h3>
					<ul className="jp-contextualized-connection__feature-list">
						<li>
							{ createInterpolateElement(
								__( '<strong>Free</strong> Content Delivery Network (CDN)', 'jetpack' ),
								{ strong: <strong /> }
							) }
						</li>
						<li>
							{ createInterpolateElement(
								__( '<strong>Free</strong> lazy image loading', 'jetpack' ),
								{ strong: <strong /> }
							) }
						</li>
						<li>
							{ createInterpolateElement( __( '<strong>Free</strong> SEO tools', 'jetpack' ), {
								strong: <strong />,
							} ) }
						</li>
						<li>{ __( 'Instant site search', 'jetpack' ) }</li>
						<li>{ __( 'Ad-free WordPress video hosting', 'jetpack' ) }</li>
					</ul>
				</div>
				<div className="jp-contextualized-connection__footer-column">
					<h3>{ __( 'Growth tools', 'jetpack' ) }</h3>
					<ul className="jp-contextualized-connection__feature-list">
						<li>
							{ createInterpolateElement( __( '<strong>Free</strong> site stats', 'jetpack' ), {
								strong: <strong />,
							} ) }
						</li>
						<li>
							{ createInterpolateElement(
								__( '<strong>Free</strong> social media tools', 'jetpack' ),
								{ strong: <strong /> }
							) }
						</li>
						<li>
							{ createInterpolateElement( __( '<strong>Free</strong> related posts', 'jetpack' ), {
								strong: <strong />,
							} ) }
						</li>
						<li>{ __( 'Accept payments', 'jetpack' ) }</li>
						<li>{ __( 'Ad network access', 'jetpack' ) }</li>
					</ul>
				</div>
			</footer>
		</div>
	);
};

ContextualizedConnection.propTypes = {
	/** The Title. */
	title: PropTypes.string,
	/** Class to be added to component. */
	className: PropTypes.string,
	/** The Connect Button label. */
	buttonLabel: PropTypes.string,
	/** API root. */
	apiRoot: PropTypes.string.isRequired,
	/** API nonce. */
	apiNonce: PropTypes.string.isRequired,
	/** Registration nonce. */
	registrationNonce: PropTypes.string.isRequired,
	/** The redirect admin URI. */
	redirectUri: PropTypes.string.isRequired,
	/** Whether to initiate the connection process automatically upon rendering the component. */
	autoTrigger: PropTypes.bool,
	/** Whether the site is connected to Jetpack or not. */
	isSiteConnected: PropTypes.bool.isRequired,
	/** The logo to display above the title */
	logo: PropTypes.shape( {
		type: PropTypes.oneOf( [ 'img', 'svg' ] ),
	} ),
};

export default ContextualizedConnection;
