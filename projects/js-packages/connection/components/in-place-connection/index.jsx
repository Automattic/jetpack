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
 * The in-place connection component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.title -- Element title.
 * @param {boolean} props.isLoading -- Whether the element is still loading.
 * @param {string|number} props.width -- Iframe width.
 * @param {string|number} props.height -- Iframe height.
 * @param {boolean} props.hasConnectedOwner -- Whether the site has connection owner connected.
 * @param {boolean} props.scrollToIframe -- Whether we need to auto-scroll the window upon element rendering.
 * @param {string} props.connectUrl -- The connection URL.
 * @param {Function} props.onComplete -- The callback to be called upon complete of the connection process.
 * @param {Function} props.onThirdPartyCookiesBlocked -- The callback to be called if third-party cookies are disabled.
 * @param {string} props.source -- Component location identifier passed to WP.com.
 *
 * @returns {React.Component} The in-place connection component.
 */
const InPlaceConnection = props => {
	const {
		title,
		isLoading,
		width,
		hasConnectedOwner,
		scrollToIframe,
		connectUrl,
		onComplete,
		onThirdPartyCookiesBlocked,
		source,
	} = props;
	let { height } = props;

	const iframeWrapRef = useRef();
	const iframeRef = useRef();

	const receiveData = e => {
		if ( e.source !== iframeRef.current.contentWindow ) {
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

	useEffect( () => {
		// Scroll to the iframe container
		if ( scrollToIframe ) {
			window.scrollTo( 0, iframeWrapRef.current.offsetTop - 10 );
		}

		// Add an event listener to identify successful authorization via iframe.
		window.addEventListener( 'message', receiveData );
	} );

	// The URL looks like https://jetpack.wordpress.com/jetpack.authorize_iframe/1/. We need to include the trailing
	// slash below so that we don't end up with something like /jetpack.authorize_iframe_iframe/
	let src = connectUrl.replace( 'authorize/', 'authorize_iframe/' );

	if ( hasConnectedOwner ) {
		src += '&display-tos';
		height = ( parseInt( height ) + 50 ).toString();
	}

	src += '&iframe_height=' + parseInt( height );

	if ( source ) {
		src += '&iframe_source=' + source;
	}

	return (
		<div className="dops-card fade-in jp-iframe-wrap" ref={ iframeWrapRef }>
			<h1>{ title }</h1>
			{ isLoading ? (
				<p>{ __( 'Loading…', 'jetpack' ) }</p>
			) : (
				<iframe
					title={ title }
					width={ width }
					height={ height }
					src={ src }
					ref={ iframeRef }
				></iframe>
			) }
		</div>
	);
};

InPlaceConnection.propTypes = {
	title: PropTypes.string.isRequired,
	isLoading: PropTypes.bool,
	width: PropTypes.string,
	height: PropTypes.string,
	connectUrl: PropTypes.string.isRequired,
	hasConnectedOwner: PropTypes.bool.isRequired,
	scrollToIframe: PropTypes.bool,
	onComplete: PropTypes.func,
	onThirdPartyCookiesBlocked: PropTypes.func,
	source: PropTypes.string,
};

InPlaceConnection.defaultProps = {
	isLoading: false,
	height: '220',
	width: '100%',
	scrollToIframe: true,
};

export default InPlaceConnection;
