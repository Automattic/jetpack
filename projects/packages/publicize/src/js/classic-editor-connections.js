import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { _n, __ } from '@wordpress/i18n';
import jQuery from 'jquery';

const {
	ajaxUrl,
	connectionsUrl,
	isEnhancedPublishingEnabled,
	resharePath,
	isReshareSupported,
	siteType,
} = window.jetpackSocialClassicEditorOptions;
const CONNECTIONS_NEED_MEDIA = [ 'instagram-business' ];

const { recordEvent } = jetpackAnalytics.tracks;

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

	const connectionNeedsMediaString = isEnhancedPublishingEnabled
		? /* translators: %s is the link to the media upload best practices. */ __(
				'You need a featured image to share to Instagram. Use the block editor for more advanced media features! <a href="%s" rel="noopener noreferrer" target="_blank">Learn more</a>.',
				'jetpack-publicize-pkg'
		  )
		: /* translators: %s is the link to the media upload best practices. */ __(
				'You need a featured image to share to Instagram. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more</a>.',
				'jetpack-publicize-pkg',
				/* dummy arg to avoid bad minification */ 0
		  );

	warningDiv
		.addClass( 'notice-warning publicize__notice-media-warning publicize__notice-warning' )
		.append(
			connectionNeedsMediaString.replace(
				'%s',
				'https://jetpack.com/support/jetpack-social/sharing-to-instagram-with-jetpack-social'
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

	//#region Share post NOW
	const shareNowButton = $( '#publicize-share-now' );
	const shareNowNotice = $( '#publicize-share-now-notice' );
	const publicizeForm = $( '#publicize-form' );
	const connections = publicizeForm.find( 'li input[type="checkbox"]' );

	const showNotice = ( text, type = 'warning' ) => {
		shareNowNotice
			.removeClass( 'notice-warning notice-success hidden' )
			.addClass( 'publicize__notice-warning notice-' + type )
			.text( text );
	};

	const hideNotice = () => {
		shareNowNotice.removeClass( 'publicize__notice-warning' ).addClass( 'hidden' ).text( '' );
	};

	const getEnabledConnections = () => {
		return connections.filter( ( index, element ) => {
			return $( element ).prop( 'checked' );
		} );
	};

	const getDisabledConnections = () => {
		return connections.filter( ( index, element ) => {
			return ! $( element ).prop( 'checked' );
		} );
	};

	shareNowButton.on( 'click', function ( e ) {
		e.preventDefault();

		if ( ! isReshareSupported ) {
			return;
		}

		hideNotice();

		if ( ! getEnabledConnections().length ) {
			showNotice(
				__( 'Please select at least one connection to share with.', 'jetpack-publicize-pkg' )
			);
			return;
		}

		const postId = $( 'input[name="post_ID"]' ).val();

		const path = resharePath.replace( '{postId}', postId );

		const skipped_connections = getDisabledConnections()
			.map( ( index, element ) => {
				return $( element ).data( 'id' );
			} )
			.toArray();

		const message = $( 'textarea[name="wpas_title"]' ).val();

		shareNowButton.prop( 'disabled', true ).text( __( 'Sharing…', 'jetpack-publicize-pkg' ) );

		recordEvent( 'jetpack_social_reshare_clicked', {
			location: 'classic-editor',
			environment: siteType,
		} );

		apiFetch( {
			path,
			method: 'POST',
			data: {
				message,
				skipped_connections,
				async: true,
			},
		} )
			.then( () => {
				showNotice( __( 'Request submitted successfully.', 'jetpack-publicize-pkg' ), 'success' );
			} )
			.catch( () => {
				showNotice( __( 'An error occurred while sharing your post.', 'jetpack-publicize-pkg' ) );
			} )
			.finally( () => {
				shareNowButton.prop( 'disabled', false ).text( __( 'Share now', 'jetpack-publicize-pkg' ) );
			} );
	} );
	//#endregion
} );
