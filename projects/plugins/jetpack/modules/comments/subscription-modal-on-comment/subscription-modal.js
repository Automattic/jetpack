document.addEventListener( 'DOMContentLoaded', function () {
	const modal = document.getElementsByClassName( 'jetpack-subscription-modal' )[ 0 ];

	if ( ! modal ) {
		return;
	}

	const close = document.getElementsByClassName( 'jetpack-subscription-modal__close' )[ 0 ];
	const subscribeBtn = document.getElementsByClassName(
		'jetpack-subscription-modal__form-submit'
	)[ 0 ];
	let redirectUrl = '';
	let subscriptionData = '';
	let hasLoaded = false;

	function reloadOnCloseSubscriptionModal( customUrl ) {
		const destinationUrl = customUrl ? new URL( customUrl ) : new URL( redirectUrl );

		// Prevent redirect to external sites.
		if ( destinationUrl.hostname !== window.location.hostname ) {
			return;
		}

		// current URL without hash
		const currentUrlWithoutHash = location.href.replace( location.hash, '' );
		// destination URL without hash
		const destinationUrlWithoutHash = destinationUrl.href.replace( destinationUrl.hash, '' );
		window.location.href = destinationUrl.href;

		// reload the page if the user is already on the comment page
		if ( currentUrlWithoutHash === destinationUrlWithoutHash ) {
			window.location.reload();
		}
	}

	function handleSubscriptionModalIframeResult( eventFromIframe ) {
		if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
			const data = JSON.parse( eventFromIframe.data );
			if ( data && data.action === 'close' ) {
				window.removeEventListener( 'message', handleSubscriptionModalIframeResult );
				reloadOnCloseSubscriptionModal( subscriptionData.url );
			}
		}
	}

	function showSubscriptionIframe( subscriptionData ) {
		const subscribeData = {
			email: document.querySelector( '.jetpack-subscription-modal__form-email' ).value,
			post_id: subscriptionData.post_id,
			plan: 'newsletter',
			blog: subscriptionData.blog_id,
			source: 'jetpack_subscribe',
			display: 'alternate',
			app_source: 'verbum-subscription-modal',
			locale: subscriptionData.lang,
		};

		const params = new URLSearchParams( subscribeData );

		const url = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

		window.scrollTo( 0, 0 );
		// eslint-disable-next-line no-undef
		tb_show( null, url + '&TB_iframe=true', null );

		window.addEventListener( 'message', handleSubscriptionModalIframeResult, false );
		const tbWindow = document.querySelector( '#TB_window' );
		tbWindow.classList.add( 'jetpack-memberships-modal' );

		// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
		window.scrollTo( 0, 0 );
	}

	function JetpackSubscriptionModalOnCommentMessageListener( event ) {
		let message = event && event.data;
		if ( typeof message === 'string' ) {
			try {
				message = JSON.parse( message );
			} catch ( err ) {
				return;
			}
		}

		const type = message && message.type;
		const data = message && message.data;

		if ( type !== 'subscriptionModalShow' || typeof data.url === 'undefined' ) {
			return;
		}

		if ( ! event.origin.includes( window.location.host ) ) {
			return;
		}

		if ( data.email ) {
			const emailInput = document.querySelector( '.jetpack-subscription-modal__form-email' );
			emailInput.value = data.email;
			if ( data.is_logged_in ) {
				emailInput.setAttribute( 'readonly', 'readonly' );
			}
		}

		if ( ! hasLoaded ) {
			const storedCount = parseInt(
				sessionStorage.getItem( 'jetpack-subscription-modal-shown-count' )
			);
			const showCount = ( isNaN( storedCount ) ? 0 : storedCount ) + 1;
			sessionStorage.setItem( 'jetpack-subscription-modal-shown-count', showCount );

			if ( showCount > 5 ) {
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_jetpack-subscribe-modal-on-comment=hidden_views_limit&r=' +
					Math.random();

				reloadOnCloseSubscriptionModal( data.url );
				return;
			}

			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_jetpack-subscribe-modal-on-comment=showed&r=' +
				Math.random();

			modal.classList.toggle( 'open' );
			hasLoaded = true;
			redirectUrl = data.url;
			subscriptionData = data;
			return;
		}
	}

	window.addEventListener( 'message', JetpackSubscriptionModalOnCommentMessageListener );

	if ( close ) {
		close.onclick = function ( event ) {
			event.preventDefault();
			modal.classList.toggle( 'open' );
			reloadOnCloseSubscriptionModal();
		};
	}

	if ( subscribeBtn ) {
		subscribeBtn.onclick = function () {
			showSubscriptionIframe( subscriptionData );
		};
	}

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			modal.style.display = 'none';
			reloadOnCloseSubscriptionModal();
		}
	};
} );
