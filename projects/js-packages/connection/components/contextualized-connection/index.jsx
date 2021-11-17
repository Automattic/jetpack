/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { JetpackLogo } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import ConnectButton from '../connect-button';
import { ToS } from '../connect-screen/basic/visual';
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
		children,
		className,
		buttonLabel,
		apiRoot,
		apiNonce,
		registrationNonce,
		redirectUri,
		autoTrigger,
		isSiteConnected,
	} = props;

	const continueToJetpack = useCallback( () => {}, [] );

	return (
		<div className={ 'jp-contextualized-connection' + ( className ? ' ' + className : '' ) }>
			<div className="jp-contextualized-connection__content">
				<JetpackLogo />

				<h2>{ title }</h2>

				{ children }

				{ isSiteConnected && (
					<Button
						isPrimary
						className="jp-contextualized-connection__button"
						label={ __( 'Continue to Jetpack', 'jetpack' ) }
						onClick={ continueToJetpack }
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
						/>
						<div className="jp-contextualized-connection__tos">{ ToS }</div>
					</>
				) }
			</div>

			<footer className="jp-contextualized-connection__footer">
				<div className="jp-contextualized-connection__footer-column">
					<h3>{ __( 'Security tools' ) }</h3>
					<ul className="jp-contextualized-connection__feature-list">
						<li>
							{ createInterpolateElement(
								__( '<strong>Free</strong> Store Downtime Monitoring', 'jetpack' ),
								{ strong: <strong /> }
							) }
						</li>
						<li>
							{ createInterpolateElement(
								__( '<strong>Free</strong>  brute force attack prevention', 'jetpack' ),
								{ strong: <strong /> }
							) }
						</li>
						<li>{ __( 'Full store & order backups', 'jetpack' ) }</li>
						<li>{ __( 'Automated malware scanning', 'jetpack' ) }</li>
						<li>{ __( 'Comment and form spam protection', 'jetpack' ) }</li>
					</ul>
				</div>
				<div className="jp-contextualized-connection__footer-column">
					<h3>{ __( 'Performance tools' ) }</h3>
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
						<li>{ __( 'Instant site search' ) }</li>
						<li>{ __( 'Ad-free WordPress video hosting' ) }</li>
					</ul>
				</div>
				<div className="jp-contextualized-connection__footer-column">
					<h3>{ __( 'Growth tools' ) }</h3>
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
						<li>{ __( 'Accept payments' ) }</li>
						<li>{ __( 'Ad network access' ) }</li>
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
};

export default ContextualizedConnection;
