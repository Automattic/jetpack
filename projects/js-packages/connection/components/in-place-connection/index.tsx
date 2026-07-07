import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef } from 'react';
import type { FC } from 'react';

import './style.scss';

interface InPlaceConnectionProps {
	/** Element title. */
	title: string;
	/** Whether the element is still loading. */
	isLoading?: boolean;
	/** Iframe width. */
	width?: string;
	/** Iframe height. */
	height?: string;
	/** Whether the site has connection owner connected. */
	displayTOS: boolean;
	/** Whether we need to auto-scroll the window upon element rendering. */
	scrollToIframe?: boolean;
	/** The connection URL. */
	connectUrl: string;
	/** The callback to be called upon complete of the connection process. */
	onComplete?: () => void;
	/** The callback to be called if third-party cookies are disabled. */
	onThirdPartyCookiesBlocked?: () => void;
	/** Component location identifier passed to WP.com. */
	location?: string;
}

/**
 * The in-place connection component.
 *
 * @param {InPlaceConnectionProps} props - The properties.
 * @return {import('react').ReactElement} The in-place connection component.
 */
const InPlaceConnection: FC< InPlaceConnectionProps > = props => {
	const {
		title,
		isLoading = false,
		width = '100%',
		displayTOS,
		scrollToIframe = false,
		connectUrl,
		onComplete,
		onThirdPartyCookiesBlocked,
		location,
	} = props;
	let { height = '300' } = props;

	const iframeWrapRef = useRef< HTMLDivElement >( null );
	const iframeRef = useRef< HTMLIFrameElement >( null );

	/**
	 * Handles messages received from inside the iframe.
	 *
	 * @param {MessageEvent} e - Event object.
	 */
	const receiveData = useCallback(
		( e: MessageEvent ) => {
			if ( ! iframeRef.current || e.source !== iframeRef.current.contentWindow ) {
				return;
			}

			switch ( e.data ) {
				case 'close':
					// Remove listener, our job here is done.
					window.removeEventListener( 'message', receiveData );

					onComplete?.();
					break;
				case 'wpcom_nocookie':
					// Third-party cookies blocked.
					onThirdPartyCookiesBlocked?.();
					break;
			}
		},
		[ onComplete, onThirdPartyCookiesBlocked ]
	);

	// Scroll to the iframe container.
	useEffect( () => {
		if ( scrollToIframe && iframeWrapRef.current ) {
			window.scrollTo( 0, iframeWrapRef.current.offsetTop - 10 );
		}
	}, [ scrollToIframe ] );

	// Listen for successful authorization via iframe; clean up on unmount to avoid a listener leak.
	useEffect( () => {
		window.addEventListener( 'message', receiveData );

		return () => window.removeEventListener( 'message', receiveData );
	}, [ receiveData ] );

	// The URL looks like https://jetpack.wordpress.com/jetpack.authorize_iframe/1/. We need to include the trailing
	// slash below so that we don't end up with something like /jetpack.authorize_iframe_iframe/
	let src = connectUrl.replace( 'authorize/', 'authorize_iframe/' );

	if ( ! src.includes( '?' ) ) {
		src += '?';
	}

	if ( displayTOS ) {
		src += '&display-tos';
		height = ( parseInt( height ) + 50 ).toString();
	}

	src += '&iframe_height=' + parseInt( height );

	if ( location ) {
		src += '&iframe_source=' + location;
	}

	return (
		<div className="dops-card fade-in jp-iframe-wrap" ref={ iframeWrapRef }>
			<h1>{ title }</h1>
			{ isLoading ? (
				<p>{ __( 'Loading…', 'jetpack-connection-js' ) }</p>
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

export default InPlaceConnection;
