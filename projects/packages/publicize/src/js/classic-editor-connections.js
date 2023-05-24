import { _n, __ } from '@wordpress/i18n';
import jQuery from 'jquery';

const { ajaxUrl, connectionsUrl } = window.jetpackSocialClassicEditorConnections;

jQuery( function ( $ ) {
	let fetchingConnTest = false;
	const publicizeConnTestStart = function () {
		if ( ! fetchingConnTest ) {
			$.post( ajaxUrl, { action: 'test_publicize_conns' }, publicizeConnTestComplete );
			fetchingConnTest = true;
		}
	};

	let timer;
	window.addEventListener( 'focus', () => {
		if ( timer ) {
			clearTimeout( timer );
		}
		timer = setTimeout( publicizeConnTestStart, 2000 );
	} );

	const countConnectionsBy = ( status, response ) => {
		return ! response.data
			? 0
			: response.data.reduce( ( count, testResult ) => {
					if (
						! testResult.connectionTestPassed &&
						status === ( testResult.connectionTestErrorCode ?? 'broken' )
					) {
						$( '#wpas-submit-' + testResult.id )
							.prop( 'checked', false )
							.prop( 'disabled', true );
						return count + 1;
					}
					return count;
			  }, 0 );
	};

	const publicizeConnTestComplete = function ( response ) {
		fetchingConnTest = false;
		const testsSelector = $( '#pub-connection-tests' );
		testsSelector
			.removeClass( 'test-in-progress' )
			.removeClass( 'below-h2' )
			.removeClass( 'error' )
			.removeClass( 'publicize-token-refresh-message' )
			.html( '' );

		const brokenConnections = countConnectionsBy( 'broken', response );
		const unsupportedConnections = countConnectionsBy( 'unsupported', response );

		if ( brokenConnections ) {
			/* translators: %s is the link to the connections page in Calypso */
			const msg = _n(
				'One of your social connections is broken. Reconnect it on the <a href="%s" rel="noopener noreferrer" target="_blank">connection management</a> page.',
				'Some of your social connections are broken. Reconnect them on the <a href="%s" rel="noopener noreferrer" target="_blank">connection management</a> page.',
				brokenConnections,
				'jetpack-publicize-pkg'
			);

			testsSelector
				.addClass( 'below-h2' )
				.addClass( 'error' )
				.addClass( 'publicize-token-refresh-message' )
				.append( msg.replace( '%s', connectionsUrl ) );
		}

		if ( unsupportedConnections ) {
			/* translators: %s is the link to the connections page in Calypso */
			const msg = __(
				'Twitter is not supported anymore. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more here</a>.',
				'jetpack-publicize-pkg'
			);

			if ( brokenConnections ) {
				testsSelector.append( '<hr />' );
			} else {
				testsSelector
					.addClass( 'below-h2' )
					.addClass( 'error' )
					.addClass( 'publicize-token-refresh-message' );
			}

			testsSelector.append( msg.replace( '%s', connectionsUrl ) );
		}
	};

	// If we have the #pub-connection-tests div present, kick off the connection test
	if ( $( '#pub-connection-tests' ).length ) {
		publicizeConnTestStart();
	}
} );
