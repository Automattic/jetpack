/* global wpcom_reblog */

var jetpackLikesWidgetBatch = [];
var jetpackLikesMasterReady = false;

// Due to performance problems on pages with a large number of widget iframes that need to be loaded,
// we are limiting the processing at any instant to unloaded widgets that are currently in viewport,
// plus this constant that will allow processing of widgets above and bellow the current fold.
// This aim of it is to improve the UX and hide the transition from unloaded to loaded state from users.
var jetpackLikesLookAhead = 2000; // pixels

// Keeps track of loaded comment likes widget so we can unload them when they are scrolled out of view.
var jetpackCommentLikesLoadedWidgets = [];

var jetpackLikesDocReadyPromise = new Promise( resolve => {
	if ( document.readyState !== 'loading' ) {
		resolve();
	} else {
		window.addEventListener( 'DOMContentLoaded', () => resolve() );
	}
} );

function JetpackLikesPostMessage( message, target ) {
	if ( typeof message === 'string' ) {
		try {
			message = JSON.parse( message );
		} catch {
			return;
		}
	}

	if ( target && typeof target.postMessage === 'function' ) {
		try {
			target.postMessage(
				JSON.stringify( {
					type: 'likesMessage',
					data: message,
				} ),
				'*'
			);
		} catch {
			// Ignore error
		}
	}
}

function JetpackLikesBatchHandler() {
	const requests = [];
	document.querySelectorAll( 'div.jetpack-likes-widget-unloaded' ).forEach( widget => {
		if ( jetpackLikesWidgetBatch.indexOf( widget.id ) > -1 ) {
			return;
		}

		if ( ! jetpackIsScrolledIntoView( widget ) ) {
			return;
		}

		jetpackLikesWidgetBatch.push( widget.id );

		var regex = /like-(post|comment)-wrapper-(\d+)-(\d+)-(\w+)/,
			match = regex.exec( widget.id ),
			info;

		if ( ! match || match.length !== 5 ) {
			return;
		}

		info = {
			blog_id: match[ 2 ],
			width: widget.width,
		};

		if ( 'post' === match[ 1 ] ) {
			info.post_id = match[ 3 ];
		} else if ( 'comment' === match[ 1 ] ) {
			info.comment_id = match[ 3 ];
		}

		info.obj_id = match[ 4 ];

		requests.push( info );
	} );

	if ( requests.length > 0 ) {
		JetpackLikesPostMessage(
			{ event: 'initialBatch', requests: requests },
			window.frames[ 'likes-master' ]
		);
	}
}

function JetpackLikesMessageListener( event ) {
	let message = event && event.data;
	if ( typeof message === 'string' ) {
		try {
			message = JSON.parse( message );
		} catch {
			return;
		}
	}

	const type = message && message.type;
	const data = message && message.data;

	if ( type !== 'likesMessage' || typeof data.event === 'undefined' ) {
		return;
	}

	// We only allow messages from one origin
	const allowedOrigin = 'https://widgets.wp.com';
	if ( allowedOrigin !== event.origin ) {
		return;
	}

	switch ( data.event ) {
		case 'masterReady':
			jetpackLikesDocReadyPromise.then( () => {
				jetpackLikesMasterReady = true;

				const stylesData = {
					event: 'injectStyles',
				};
				const sdTextColor = document.querySelector( '.sd-text-color' );
				const sdLinkColor = document.querySelector( '.sd-link-color' );
				const sdTextColorStyles = ( sdTextColor && getComputedStyle( sdTextColor ) ) || {};
				const sdLinkColorStyles = ( sdLinkColor && getComputedStyle( sdLinkColor ) ) || {};

				// enable reblogs if we're on a single post page
				if ( document.body.classList.contains( 'single' ) ) {
					JetpackLikesPostMessage( { event: 'reblogsEnabled' }, window.frames[ 'likes-master' ] );
				}

				stylesData.textStyles = {
					color: sdTextColorStyles.color,
					fontFamily: sdTextColorStyles[ 'font-family' ],
					fontSize: sdTextColorStyles[ 'font-size' ],
					direction: sdTextColorStyles.direction,
					fontWeight: sdTextColorStyles[ 'font-weight' ],
					fontStyle: sdTextColorStyles[ 'font-style' ],
					textDecoration: sdTextColorStyles[ 'text-decoration' ],
				};

				stylesData.linkStyles = {
					color: sdLinkColorStyles.color,
					fontFamily: sdLinkColorStyles[ 'font-family' ],
					fontSize: sdLinkColorStyles[ 'font-size' ],
					textDecoration: sdLinkColorStyles[ 'text-decoration' ],
					fontWeight: sdLinkColorStyles[ 'font-weight' ],
					fontStyle: sdLinkColorStyles[ 'font-style' ],
				};

				JetpackLikesPostMessage( stylesData, window.frames[ 'likes-master' ] );

				JetpackLikesBatchHandler();
			} );

			break;

		case 'showLikeWidget': {
			const placeholder = document.querySelector( `#${ data.id } .likes-widget-placeholder` );
			if ( placeholder ) {
				placeholder.style.display = 'none';
			}

			// Add a `liked` class to the wrapper if the post already has likes.
			if ( data.total > 0 ) {
				document.querySelector( `#${ data.id }` ).classList.add( 'liked' );
			}

			break;
		}

		case 'showCommentLikeWidget': {
			const placeholder = document.querySelector( `#${ data.id } .likes-widget-placeholder` );
			if ( placeholder ) {
				placeholder.style.display = 'none';
			}
			break;
		}

		case 'killCommentLikes':
			// If kill switch for comment likes is enabled remove all widgets wrappers and `Loading...` placeholders.
			document
				.querySelectorAll( '.jetpack-comment-likes-widget-wrapper' )
				.forEach( wrapper => wrapper.remove() );
			break;

		case 'clickReblogFlair':
			if ( wpcom_reblog && typeof wpcom_reblog.toggle_reblog_box_flair === 'function' ) {
				wpcom_reblog.toggle_reblog_box_flair( data.obj_id );
			}
			break;

		case 'hideOtherGravatars': {
			hideLikersPopover();
			break;
		}

		case 'clickPostLike':
			// Add or remove the wrapper `liked` class based on the total likes.
			if ( data.total > 0 ) {
				document.querySelector( `#${ data.id }` ).classList.add( 'liked' );
			} else {
				document.querySelector( `#${ data.id }` ).classList.remove( 'liked' );
			}

			break;

		case 'showOtherGravatars': {
			const container = document.querySelector( '#likes-other-gravatars' );

			if ( ! container ) {
				break;
			}

			const list = container.querySelector( 'ul' );

			container.style.display = 'none';
			list.innerHTML = '';

			container
				.querySelectorAll( '.likes-text span' )
				.forEach( item => ( item.textContent = data.totalLikesLabel ) );

			( data.likers || [] ).forEach( async ( liker, index ) => {
				if ( liker.profile_URL.substr( 0, 4 ) !== 'http' ) {
					// We only display gravatars with http or https schema
					return;
				}

				const element = document.createElement( 'li' );
				list.append( element );

				const profileLink = encodeURI( liker.profile_URL );
				const avatarLink = encodeURI( liker.avatar_URL );
				element.innerHTML = `<a href="${ profileLink }" rel="nofollow" target="_parent" class="wpl-liker">
						<img src="${ avatarLink }"
							alt=""
							style="width: 28px; height: 28px;" />
						<span></span>
					</a>`;

				// Add some extra attributes through native methods, to ensure strings are sanitized.
				element.classList.add( liker.css_class );
				element.querySelector( 'img' ).alt = data.avatarAltTitle.replace( '%s', liker.name );
				element.querySelector( 'span' ).innerText = liker.name;

				if ( index === data.likers.length - 1 ) {
					element.addEventListener( 'keydown', e => {
						if ( e.key === 'Tab' && ! e.shiftKey ) {
							e.preventDefault();
							hideLikersPopover();

							JetpackLikesPostMessage(
								{ event: 'focusLikesCount', parent: data.parent },
								window.frames[ 'likes-master' ]
							);
						}
					} );
				}
			} );

			const positionPopup = function () {
				const containerStyle = getComputedStyle( container );
				const isRtl = containerStyle.direction === 'rtl';

				const el = document.querySelector( `*[name='${ data.parent }']` );
				const rect = el.getBoundingClientRect();
				const win = el.ownerDocument.defaultView;
				const offset = {
					top: rect.top + win.pageYOffset,
					left: rect.left + win.pageXOffset,
				};

				let containerLeft = 0;
				container.style.top = offset.top + data.position.top - 1 + 'px';

				if ( isRtl ) {
					const visibleAvatarsCount = data && data.likers ? Math.min( data.likers.length, 5 ) : 0;
					// 24px is the width of the avatar + 4px is the padding between avatars
					containerLeft = offset.left + data.position.left + 24 * visibleAvatarsCount + 4;
					container.style.transform = 'translateX(-100%)';
				} else {
					containerLeft = offset.left + data.position.left;
				}
				container.style.left = containerLeft + 'px';

				// Container width - padding
				const initContainerWidth = data.width - 20;
				const rowLength = Math.floor( initContainerWidth / 37 );
				// # of rows + (avatar + avatar padding) + text above + container padding
				let height = Math.ceil( data.likers.length / rowLength ) * 37 + 17 + 22;
				if ( height > 204 ) {
					height = 204;
				}

				// If the popup overflows viewport width, we should show it on the next line.
				// Push it offscreen to calculated rendered width.
				container.style.left = '-9999px';
				container.style.display = 'block';

				// If the popup exceeds the viewport width,
				// flip the position of the popup.
				const containerWidth = container.offsetWidth;
				const containerRight = containerLeft + containerWidth;
				if ( containerRight > win.innerWidth ) {
					containerLeft = rect.right - containerWidth;
				}

				// Set the container left
				container.style.left = containerLeft + 'px';
				container.setAttribute( 'aria-hidden', 'false' );
			};

			positionPopup();
			container.focus();

			const debounce = function ( func, wait ) {
				var timeout;
				return function () {
					var context = this;
					var args = arguments;
					clearTimeout( timeout );
					timeout = setTimeout( function () {
						func.apply( context, args );
					}, wait );
				};
			};

			const debouncedPositionPopup = debounce( positionPopup, 100 );

			// Keep a reference of this function in the element itself
			// so that we can destroy it later
			container.__resizeHandler = debouncedPositionPopup;

			// When window is resized, resize the popup.
			window.addEventListener( 'resize', debouncedPositionPopup );

			container.focus();
		}
	}
}

window.addEventListener( 'message', JetpackLikesMessageListener );

function hideLikersPopover() {
	const container = document.querySelector( '#likes-other-gravatars' );

	if ( container ) {
		container.style.display = 'none';
		container.setAttribute( 'aria-hidden', 'true' );

		// Remove the resize event listener and cleanup.
		const resizeHandler = container.__resizeHandler;
		if ( resizeHandler ) {
			window.removeEventListener( 'resize', resizeHandler );
			delete container.__resizeHandler;
		}
	}
}

document.addEventListener( 'click', hideLikersPopover );

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

	for ( var i = 0, length = unloadedWidgetsInView.length; i <= length - 1; i++ ) {
		wrapperID = unloadedWidgetsInView[ i ].id;

		if ( ! wrapperID ) {
			continue;
		}

		jetpackLoadLikeWidgetIframe( wrapperID );
	}
}

function jetpackLoadLikeWidgetIframe( wrapperID ) {
	if ( typeof wrapperID === 'undefined' ) {
		return;
	}

	const wrapper = document.querySelector( '#' + wrapperID );
	wrapper.querySelectorAll( 'iframe' ).forEach( iFrame => iFrame.remove() );

	const placeholder = wrapper.querySelector( '.likes-widget-placeholder' );

	// Post like iframe
	if ( placeholder && placeholder.classList.contains( 'post-likes-widget-placeholder' ) ) {
		const postLikesFrame = document.createElement( 'iframe' );

		postLikesFrame.classList.add( 'post-likes-widget', 'jetpack-likes-widget' );
		postLikesFrame.name = wrapper.dataset.name;
		postLikesFrame.src = wrapper.dataset.src;
		postLikesFrame.height = '55px';
		postLikesFrame.width = '100%';
		postLikesFrame.frameBorder = '0';
		postLikesFrame.scrolling = 'no';
		postLikesFrame.title = wrapper.dataset.title;

		placeholder.after( postLikesFrame );
	}

	// Comment like iframe
	if ( placeholder.classList.contains( 'comment-likes-widget-placeholder' ) ) {
		const commentLikesFrame = document.createElement( 'iframe' );

		commentLikesFrame.class = 'comment-likes-widget-frame jetpack-likes-widget-frame';
		commentLikesFrame.name = wrapper.dataset.name;
		commentLikesFrame.src = wrapper.dataset.src;
		commentLikesFrame.height = '18px';
		commentLikesFrame.width = '100%';
		commentLikesFrame.frameBorder = '0';
		commentLikesFrame.scrolling = 'no';

		wrapper.querySelector( '.comment-like-feedback' ).after( commentLikesFrame );

		jetpackCommentLikesLoadedWidgets.push( commentLikesFrame );
	}

	wrapper.classList.remove( 'jetpack-likes-widget-unloaded' );
	wrapper.classList.add( 'jetpack-likes-widget-loading' );

	wrapper.querySelector( 'iframe' ).addEventListener( 'load', e => {
		JetpackLikesPostMessage(
			{ event: 'loadLikeWidget', name: e.target.name, width: e.target.width },
			window.frames[ 'likes-master' ]
		);

		wrapper.classList.remove( 'jetpack-likes-widget-loading' );
		wrapper.classList.add( 'jetpack-likes-widget-loaded' );
	} );
}

function jetpackGetUnloadedWidgetsInView() {
	const unloadedWidgets = document.querySelectorAll( 'div.jetpack-likes-widget-unloaded' );

	return [ ...unloadedWidgets ].filter( item => jetpackIsScrolledIntoView( item ) );
}

function jetpackIsScrolledIntoView( element ) {
	const top = element.getBoundingClientRect().top;
	const bottom = element.getBoundingClientRect().bottom;

	// Allow some slack above and bellow the fold with jetpackLikesLookAhead,
	// with the aim of hiding the transition from unloaded to loaded widget from users.
	return top + jetpackLikesLookAhead >= 0 && bottom <= window.innerHeight + jetpackLikesLookAhead;
}

function jetpackUnloadScrolledOutWidgets() {
	for ( let i = jetpackCommentLikesLoadedWidgets.length - 1; i >= 0; i-- ) {
		const currentWidgetIframe = jetpackCommentLikesLoadedWidgets[ i ];

		if ( ! jetpackIsScrolledIntoView( currentWidgetIframe ) ) {
			const widgetWrapper =
				currentWidgetIframe &&
				currentWidgetIframe.parentElement &&
				currentWidgetIframe.parentElement.parentElement;

			// Restore parent class to 'unloaded' so this widget can be picked up by queue manager again if needed.
			widgetWrapper.classList.remove( 'jetpack-likes-widget-loaded' );
			widgetWrapper.classList.remove( 'jetpack-likes-widget-loading' );
			widgetWrapper.classList.add( 'jetpack-likes-widget-unloaded' );

			// Bring back the loading placeholder into view.
			widgetWrapper
				.querySelectorAll( '.comment-likes-widget-placeholder' )
				.forEach( item => ( item.style.display = 'block' ) );

			// Remove it from the list of loaded widgets.
			jetpackCommentLikesLoadedWidgets.splice( i, 1 );

			// Remove comment like widget iFrame.
			currentWidgetIframe.remove();
		}
	}
}

var jetpackWidgetsDelayedExec = function ( after, fn ) {
	var timer;
	return function () {
		clearTimeout( timer );
		timer = setTimeout( fn, after );
	};
};

var jetpackOnScrollStopped = jetpackWidgetsDelayedExec( 250, JetpackLikesWidgetQueueHandler );

// Load initial batch of widgets, prior to any scrolling events.
JetpackLikesWidgetQueueHandler();

// Add event listener to execute queue handler after scroll.
window.addEventListener( 'scroll', jetpackOnScrollStopped, true );
