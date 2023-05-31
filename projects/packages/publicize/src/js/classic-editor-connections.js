import { _n, __ } from '@wordpress/i18n';
import jQuery from 'jquery';

const { ajaxUrl, connectionsUrl } = window.jetpackSocialClassicEditorConnections;
const CONNECTIONS_NEED_MEDIA = [ 'instagram-business' ];

const validateFeaturedMedia = ( $, connectionsNeedValidation ) => {
	const featuredImage = window.wp.media.featuredImage.get();
	// TODO: Find a way to get size for validation.
	const isFeaturedImageValid = featuredImage && featuredImage !== -1;
	const warningDiv = $( '#pub-connection-needs-media' );
	const warningDivHasContent = !! warningDiv.html();

	// If the state is already correct, don't do anything.
	if ( isFeaturedImageValid !== warningDivHasContent ) {
		return;
	}

	connectionsNeedValidation.forEach( connectionName => {
		$( '.wpas-submit-' + connectionName ).each( ( _, element ) => {
			const el = $( element );
			const disabled = el.prop( 'disabled' );

			if ( ! disabled && ! isFeaturedImageValid ) {
				el.data( 'checkedVal', el.prop( 'checked' ) );
			}
			el.prop( 'checked', isFeaturedImageValid && el.data( 'checkedVal' ) );
			el.prop( 'disabled', ! isFeaturedImageValid );
		} );
	} );

	if ( isFeaturedImageValid ) {
		warningDiv.removeClass().html( '' );
		return;
	}

	/* translators: %s is the link to the media upload best practices. */
	const connectionNeedsMediaString = __(
		'You need a valid image in your post to share to Instagram. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more</a>.',
		'jetpack-publicize-pkg'
	);

	warningDiv
		.addClass( 'notice-warning publicize__notice-media-warning publicize__notice-warning' )
		.append(
			connectionNeedsMediaString.replace(
				'%s',
				'https://jetpack.com/redirect/?source=jetpack-social-media-support-information'
			)
		);
};

jQuery( function ( $ ) {
	const connectionsNeedValidation = CONNECTIONS_NEED_MEDIA.filter(
		connectionName => $( '.wpas-submit-' + connectionName ).length
	);

	if ( connectionsNeedValidation.length > 0 ) {
		validateFeaturedMedia( $, connectionsNeedValidation );

		const oldSet = window.wp.media.featuredImage.set;
		// We need to override the set method to validate the featured image when it changes.
		window.wp.media.featuredImage.set = function ( id ) {
			oldSet( id );
			validateFeaturedMedia( $, connectionsNeedValidation );
		};
	}

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
				'Twitter is not supported anymore. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more</a>.',
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
