/* global pm, wpcom_reblog, JSON */

var jetpackLikesWidgetBatch = [];
var jetpackLikesMasterReady = false;

// Due to performance problems on pages with a large number of widget iframes that need to be loaded,
// we are limiting the processing at any instant to unloaded widgets that are currently in viewport,
// plus this constant that will allow processing of widgets above and bellow the current fold.
// This aim of it is to improve the UX and hide the transition from unloaded to loaded state from users.
var jetpackLikesLookAhead = 2000; // pixels

// Keeps track of loaded comment likes widget so we can unload them when they are scrolled out of view.
var jetpackCommentLikesLoadedWidgets = [];

function JetpackLikesPostMessage(message, target ) {
	if ( 'string' === typeof message ){
		try {
			message = JSON.parse( message );
		} catch(e) {
			return;
		}
	}

	pm( {
		target: target,
		type: 'likesMessage',
		data: message,
		origin: '*'
	} );
}

function JetpackLikesBatchHandler() {
	var requests = [];
	jQuery( 'div.jetpack-likes-widget-unloaded' ).each( function() {
		if ( jetpackLikesWidgetBatch.indexOf( this.id ) > -1 ) {
			return;
		}

		if ( ! jetpackIsScrolledIntoView( this ) ) {
			return;
		}

		jetpackLikesWidgetBatch.push( this.id );

		var regex = /like-(post|comment)-wrapper-(\d+)-(\d+)-(\w+)/,
			match = regex.exec( this.id ),
			info;

		if ( ! match || match.length !== 5 ) {
			return;
		}

		info = {
			blog_id: match[2],
			width:   this.width
		};

		if ( 'post' === match[1] ) {
			info.post_id = match[3];
		} else if ( 'comment' === match[1] ) {
			info.comment_id = match[3];
		}

		info.obj_id = match[4];

		requests.push( info );
	});

	if ( requests.length > 0 ) {
		JetpackLikesPostMessage( { event: 'initialBatch', requests: requests }, window.frames['likes-master'] );
	}
}

function JetpackLikesMessageListener( event, message ) {
	var allowedOrigin, $container, $list, offset, rowLength, height, scrollbarWidth;

	if ( 'undefined' === typeof event.event ) {
		return;
	}

	// We only allow messages from one origin
	allowedOrigin = 'https://widgets.wp.com';
	if ( allowedOrigin !== message.origin ) {
		return;
	}

	switch ( event.event ) {
		case 'masterReady':
			jQuery( document ).ready( function() {
				jetpackLikesMasterReady = true;

				var stylesData = {
						event: 'injectStyles'
					},
					$sdTextColor = jQuery( '.sd-text-color' ),
					$sdLinkColor = jQuery( '.sd-link-color' );

				if ( jQuery( 'iframe.admin-bar-likes-widget' ).length > 0 ) {
					JetpackLikesPostMessage( { event: 'adminBarEnabled' }, window.frames[ 'likes-master' ] );

					stylesData.adminBarStyles = {
						background: jQuery( '#wpadminbar .quicklinks li#wp-admin-bar-wpl-like > a' ).css( 'background' ),
						isRtl: ( 'rtl' === jQuery( '#wpadminbar' ).css( 'direction' ) )
					};
				}

				if ( ! window.addEventListener ) {
					jQuery( '#wp-admin-bar-admin-bar-likes-widget' ).hide();
				}

				stylesData.textStyles = {
					color:          $sdTextColor.css( 'color' ),
					fontFamily:     $sdTextColor.css( 'font-family' ),
					fontSize:       $sdTextColor.css( 'font-size' ),
					direction:      $sdTextColor.css( 'direction' ),
					fontWeight:     $sdTextColor.css( 'font-weight' ),
					fontStyle:      $sdTextColor.css( 'font-style' ),
					textDecoration: $sdTextColor.css( 'text-decoration' )
				};

				stylesData.linkStyles = {
					color:          $sdLinkColor.css( 'color' ),
					fontFamily:     $sdLinkColor.css( 'font-family' ),
					fontSize:       $sdLinkColor.css( 'font-size' ),
					textDecoration: $sdLinkColor.css( 'text-decoration' ),
					fontWeight:     $sdLinkColor.css( 'font-weight' ),
					fontStyle:      $sdLinkColor.css( 'font-style' )
				};

				JetpackLikesPostMessage( stylesData, window.frames[ 'likes-master' ] );

				JetpackLikesBatchHandler();
			} );

			break;

		case 'showLikeWidget':
			jQuery( '#' + event.id + ' .likes-widget-placeholder' ).fadeOut( 'fast' );
			break;

		case 'showCommentLikeWidget':
			jQuery( '#' + event.id + ' .likes-widget-placeholder' ).fadeOut( 'fast' );
			break;

		case 'killCommentLikes':
			// If kill switch for comment likes is enabled remove all widgets wrappers and `Loading...` placeholders.
			jQuery( '.jetpack-comment-likes-widget-wrapper' ).remove();
			break;

		case 'clickReblogFlair':
			wpcom_reblog.toggle_reblog_box_flair( event.obj_id );
			break;

		case 'showOtherGravatars':
			$container = jQuery( '#likes-other-gravatars' );
			$list = $container.find( 'ul' );

			$container.hide();
			$list.html( '' );

			$container.find( '.likes-text span' ).text( event.total );

			jQuery.each( event.likers, function( i, liker ) {
				var element;

				if ( 'http' !== liker.profile_URL.substr( 0, 4 ) ) {
					// We only display gravatars with http or https schema
					return;
				}

				element = jQuery( '<li><a><img /></a></li>' );
				element.addClass( liker.css_class );

				element.find( 'a' ).
				attr( {
					href: liker.profile_URL,
					rel: 'nofollow',
					target: '_parent'
				} ).
				addClass( 'wpl-liker' );

				element.find( 'img' ).
				attr( {
					src: liker.avatar_URL,
					alt: liker.name
				} ).
				css( {
					width: '30px',
					height: '30px',
					paddingRight: '3px'
				} );

				$list.append( element );
			} );

			offset = jQuery( '[name=\'' + event.parent + '\']' ).offset();

			$container.css( 'left', offset.left + event.position.left - 10 + 'px' );
			$container.css( 'top', offset.top + event.position.top - 33 + 'px' );

			rowLength = Math.floor( event.width / 37 );
			height = ( Math.ceil( event.likers.length / rowLength ) * 37 ) + 13;
			if ( height > 204 ) {
				height = 204;
			}

			$container.css( 'height', height + 'px' );
			$container.css( 'width', rowLength * 37 - 7 + 'px' );

			$list.css( 'width', rowLength * 37 + 'px' );

			$container.fadeIn( 'slow' );

			scrollbarWidth = $list[0].offsetWidth - $list[0].clientWidth;
			if ( scrollbarWidth > 0 ) {
				$container.width( $container.width() + scrollbarWidth );
				$list.width( $list.width() + scrollbarWidth );
			}
	}
}

pm.bind( 'likesMessage', JetpackLikesMessageListener );

jQuery( document ).click( function( e ) {
	var $container = jQuery( '#likes-other-gravatars' );

	if ( $container.has( e.target ).length === 0 ) {
		$container.fadeOut( 'slow' );
	}
});

function JetpackLikesWidgetQueueHandler() {
	var wrapperID;

	if ( ! jetpackLikesMasterReady ) {
		setTimeout( JetpackLikesWidgetQueueHandler, 500 );
		return;
	}

	// Restore widgets to initial unloaded state when they are scrolled out of view.
	jetpackUnloadScrolledOutWidgets();

	var unloadedWidgetsInView = jetpackGetUnloadedWidgetsInView();

	if ( unloadedWidgetsInView.length > 0 ) {
		// Grab any unloaded widgets for a batch request
		JetpackLikesBatchHandler();
	}

	for ( var i=0, length = unloadedWidgetsInView.length; i <= length - 1; i++ ) {
		wrapperID = unloadedWidgetsInView[i].id;

		if ( ! wrapperID ){
			continue;
		}

		jetpackLoadLikeWidgetIframe( wrapperID );
	}
}

function jetpackLoadLikeWidgetIframe( wrapperID ) {
	var $wrapper;
	
	if ( 'undefined' === typeof wrapperID ) {
		return;
	}

	$wrapper = jQuery( '#' + wrapperID );
	$wrapper.find( 'iframe' ).remove();

	var placeholder = $wrapper.find( '.likes-widget-placeholder' );

	// Post like iframe
	if ( placeholder.hasClass( 'post-likes-widget-placeholder' ) ) {
		var postLikesFrame = document.createElement( 'iframe' );

		postLikesFrame['class'] = 'post-likes-widget jetpack-likes-widget';
		postLikesFrame.name = $wrapper.data( 'name' );
		postLikesFrame.src = $wrapper.data( 'src' );
		postLikesFrame.height = '18px';
		postLikesFrame.width = '200px';
		postLikesFrame.frameBorder = '0';
		postLikesFrame.scrolling = 'no';

		if ( $wrapper.hasClass( 'slim-likes-widget' ) ) {
			postLikesFrame.height = '22px';
			postLikesFrame.width = '68px';
			postLikesFrame.scrolling = 'no';
		} else {
			postLikesFrame.height = '55px';
			postLikesFrame.width = '100%';
		}

		placeholder.after( postLikesFrame );
	}

	// Comment like iframe
	if ( placeholder.hasClass( 'comment-likes-widget-placeholder' ) ) {
		var commentLikesFrame = document.createElement( 'iframe' );

		commentLikesFrame['class'] = 'comment-likes-widget-frame jetpack-likes-widget-frame';
		commentLikesFrame.name = $wrapper.data( 'name' );
		commentLikesFrame.src = $wrapper.data( 'src' );
		commentLikesFrame.height = '18px';
		commentLikesFrame.width = '200px';
		commentLikesFrame.frameBorder = '0';
		commentLikesFrame.scrolling = 'no';

		$wrapper.find( '.comment-like-feedback' ).after( commentLikesFrame );
		
		jetpackCommentLikesLoadedWidgets.push( commentLikesFrame );
	}

	$wrapper.removeClass( 'jetpack-likes-widget-unloaded' ).addClass( 'jetpack-likes-widget-loading' );

	$wrapper.find( 'iframe' ).load( function( e ) {
		var $iframe = jQuery( e.target );

		JetpackLikesPostMessage( { event: 'loadLikeWidget', name: $iframe.attr( 'name' ), width: $iframe.width() }, window.frames[ 'likes-master' ] );

		$wrapper.removeClass( 'jetpack-likes-widget-loading' ).addClass( 'jetpack-likes-widget-loaded' );

		if ( $wrapper.hasClass( 'slim-likes-widget' ) ) {
			$wrapper.find( 'iframe' ).Jetpack( 'resizeable' );
		}
	});
}

function jetpackGetUnloadedWidgetsInView() {
	var $unloadedWidgets = jQuery( 'div.jetpack-likes-widget-unloaded' );

	return $unloadedWidgets.filter( function() {
		return jetpackIsScrolledIntoView( this );
	} );
}

function jetpackIsScrolledIntoView( element ) {
	var top = element.getBoundingClientRect().top;
	var bottom = element.getBoundingClientRect().bottom;

	// Allow some slack above and bellow the fold with jetpackLikesLookAhead,
	// with the aim of hiding the transition from unloaded to loaded widget from users.
	return ( top + jetpackLikesLookAhead >= 0 ) && ( bottom <= window.innerHeight + jetpackLikesLookAhead );
}

function jetpackUnloadScrolledOutWidgets() {
	for ( var i = jetpackCommentLikesLoadedWidgets.length - 1; i >= 0; i-- ) {
		var currentWidgetIframe = jetpackCommentLikesLoadedWidgets[ i ];

		if ( ! jetpackIsScrolledIntoView( currentWidgetIframe ) ) {
			var $widgetWrapper = jQuery( currentWidgetIframe ).parent().parent();

			// Restore parent class to 'unloaded' so this widget can be picked up by queue manager again if needed.
			$widgetWrapper
				.removeClass( 'jetpack-likes-widget-loaded jetpack-likes-widget-loading' )
				.addClass( 'jetpack-likes-widget-unloaded' );

			// Bring back the loading placeholder into view.
			$widgetWrapper.children( '.comment-likes-widget-placeholder' ).fadeIn();

			// Remove it from the list of loaded widgets.
			jetpackCommentLikesLoadedWidgets.splice( i, 1 );

			// Remove comment like widget iFrame.
			jQuery( currentWidgetIframe ).remove();
		}
	}
}

var jetpackWidgetsDelayedExec = function( after, fn ) {
	var timer;
	return function() {
		timer && clearTimeout( timer );
		timer = setTimeout( fn, after );
	};
};

var jetpackOnScrollStopped = jetpackWidgetsDelayedExec( 250, JetpackLikesWidgetQueueHandler );

// Load initial batch of widgets, prior to any scrolling events.
JetpackLikesWidgetQueueHandler();

// Add event listener to execute queue handler after scroll.
window.addEventListener( 'scroll', jetpackOnScrollStopped, true );
