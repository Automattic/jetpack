/**
 * External dependencies
 */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';
import Button from 'components/button';
import analytics from 'lib/analytics';
import restApi from 'rest-api';

/**
 * The popup connection component. Useful for authorizing the site inline after site-level connection.
 *
 * @param {object} props -- The properties.
 * @param {string} props.title -- Element title.
 * @param {boolean} props.isLoading -- Whether the element is still loading.
 * @param {boolean} props.displayTOS -- Whether the site has connection owner connected.
 * @param {boolean} props.scrollTo -- Whether we need to auto-scroll the window upon element rendering.
 * @param {string} props.connectUrl -- The connection URL.
 * @param {Function} props.onClosed -- The callback to be called when the pop-up dialog is closed.
 * @param {Function} props.onSuccess -- The callback to be called when the connecton is successful
 * @param {string} props.location -- Component location identifier passed to WP.com.
 *
 * @returns {React.Component} The popup connection component.
 */
const PopUpConnection = props => {
	const { title, isLoading, displayTOS, scrollTo, connectUrl, onClosed, onSuccess } = props;

	const buttonWrapRef = useRef();
	const [ dialogIsOpen, setDialogIsOpen ] = useState( false );

	// const refreshConnectionData = () => {
	// 	restApi
	// 		.fetchUserConnectionData()
	// 		.then( userConnectionData => {
	// 			if ( userConnectionData.currentOwner ) {
	// 				if ( onClosed ) {
	// 					onClosed();
	// 				}
	// 			} else {
	// 				// display notice that connection was not successful
	// 			}
	// 		} )
	// 		.catch( error => {
	// 			// display notice that connection was not successful
	// 		} );
	// }

	const loadPopup = ( e, url ) => {
		e.preventDefault();

		// Track click
		analytics.tracks.recordJetpackClick( 'link_account_in_popup' );

		// close the window when done authorizing
		url = url + '&close_window_after_auth=1';

		const dialog = window.open(
			url,
			'jetpack-connect',
			'status=0,toolbar=0,location=1,menubar=0,directories=0,resizable=1,scrollbars=1,height=660,width=500'
		);

		setDialogIsOpen( true );

		var timer = setInterval( function () {
			// detect authorized status and closed dialog
			if ( dialog.closed ) {
				clearInterval( timer );
				console.warn( 'detected dialog closed' );
				setDialogIsOpen( false );
				// refreshConnectionData();

				if ( onClosed ) {
					onClosed();
				}
			}
		}, 1000 );
	};

	useEffect(
		/**
		 * The component initialization.
		 */
		() => {
			// Scroll to the button container
			if ( scrollTo ) {
				window.scrollTo( 0, buttonWrapRef.current.offsetTop - 10 );
			}
		}
	);

	// The URL looks like https://jetpack.wordpress.com/jetpack.authorize_iframe/1/. We need to include the trailing
	// slash below so that we don't end up with something like /jetpack.authorize_iframe_iframe/
	let src = connectUrl; //.replace( 'authorize/', 'authorize_iframe/' );

	if ( ! src.includes( '?' ) ) {
		src += '?';
	}

	const buttonProps = {
		className: 'is-primary jp-jetpack-connect__button',
		href: src,
		disabled: isLoading || dialogIsOpen,
		onClick: e => loadPopup( e, src ),
	};

	return (
		<div className="dops-card fade-in" ref={ buttonWrapRef }>
			<Button { ...buttonProps }>{ title }</Button>
			{ displayTOS && <p>Terms of service goes here</p> }
		</div>
	);
};

PopUpConnection.propTypes = {
	title: PropTypes.string.isRequired,
	isLoading: PropTypes.bool,
	connectUrl: PropTypes.string.isRequired,
	displayTOS: PropTypes.bool.isRequired,
	scrollTo: PropTypes.bool,
	onClosed: PropTypes.func,
	location: PropTypes.string,
};

PopUpConnection.defaultProps = {
	isLoading: false,
	scrollTo: false,
};

export default PopUpConnection;
