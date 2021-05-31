/**
 * External dependencies
 */
import React, { useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The popup connection component. Useful for authorizing the site inline after site-level connection.
 *
 * @param {object} props -- The properties.
 * @param {string} props.title -- Element title.
 * @param {boolean} props.isLoading -- Whether the element is still loading.
 * @param {boolean} props.displayTOS -- Whether the site has connection owner connected.
 * @param {boolean} props.scrollToIframe -- Whether we need to auto-scroll the window upon element rendering.
 * @param {string} props.connectUrl -- The connection URL.
 * @param {Function} props.onComplete -- The callback to be called upon complete of the connection process.
 * @param {Function} props.onThirdPartyCookiesBlocked -- The callback to be called if third-party cookies are disabled.
 * @param {string} props.location -- Component location identifier passed to WP.com.
 *
 * @returns {React.Component} The popup connection component.
 */
const PopUpConnection = props => {
	const {
		title,
		isLoading,
		displayTOS,
		scrollToIframe,
		connectUrl,
		onComplete,
		onThirdPartyCookiesBlocked,
		location,
	} = props;

	const iframeWrapRef = useRef();
	const iframeRef = useRef();

	/**
	 * Handles messages received from inside the iframe.
	 *
	 * @param {object} e -- Event object.
	 */
	const receiveData = e => {
		if ( ! iframeRef.current || e.source !== iframeRef.current.contentWindow ) {
			return;
		}

		switch ( e.data ) {
			case 'close':
				// Remove listener, our job here is done.
				window.removeEventListener( 'message', receiveData );

				if ( onComplete ) {
					onComplete();
				}
				break;
			case 'wpcom_nocookie':
				// Third-party cookies blocked.
				if ( onThirdPartyCookiesBlocked ) {
					onThirdPartyCookiesBlocked();
				}
				break;
		}
	};

	useEffect(
		/**
		 * The component initialization.
		 */
		() => {
			// Scroll to the iframe container
			if ( scrollToIframe ) {
				window.scrollTo( 0, iframeWrapRef.current.offsetTop - 10 );
			}

			// Add an event listener to identify successful authorization via iframe.
			window.addEventListener( 'message', receiveData );
		}
	);

	// The URL looks like https://jetpack.wordpress.com/jetpack.authorize_iframe/1/. We need to include the trailing
	// slash below so that we don't end up with something like /jetpack.authorize_iframe_iframe/
	let src = connectUrl.replace( 'authorize/', 'authorize_iframe/' );

	if ( ! src.includes( '?' ) ) {
		src += '?';
	}

	if ( displayTOS ) {
		src += '&display-tos';
	}

	if ( location ) {
		src += '&iframe_source=' + location;
	}

	return (
		<div className="dops-card fade-in jp-iframe-wrap" ref={ iframeWrapRef }>
			<h1>{ title }</h1>
			{ isLoading ? (
				<p>{ __( 'Loading…', 'jetpack' ) }</p>
			) : (
				<iframe title={ title } src={ src } ref={ iframeRef }></iframe>
			) }
		</div>
	);
};

PopUpConnection.propTypes = {
	title: PropTypes.string.isRequired,
	isLoading: PropTypes.bool,
	connectUrl: PropTypes.string.isRequired,
	displayTOS: PropTypes.bool.isRequired,
	scrollToIframe: PropTypes.bool,
	onComplete: PropTypes.func,
	onThirdPartyCookiesBlocked: PropTypes.func,
	location: PropTypes.string,
};

PopUpConnection.defaultProps = {
	isLoading: false,
	scrollToIframe: false,
};

export default PopUpConnection;
