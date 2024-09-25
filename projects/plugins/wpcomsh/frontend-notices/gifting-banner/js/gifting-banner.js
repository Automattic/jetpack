// NOTICE! This file exists in WPCOM & WPCOMSH. Updates need to be synced to both repos.

/* eslint-disable no-multi-str */
/* global gifting_banner */
( function () {
	document.addEventListener( 'DOMContentLoaded', function () {
		const hostnames = [ 'wordpress.com', 'w.link', 'automattic.com' ];
		// Make sure we never show the banner on these hostnames.
		if ( hostnames.includes( window.location.hostname ) ) {
			return;
		}

		const bumpStat = function ( statName ) {
			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/b.gif' +
				'?v=wpcom-no-pv' +
				'&x_simple_gifting_banner=' +
				statName +
				'&rand=' +
				Math.random();
		};

		if ( ! document.cookie.includes( 'wpcom_gifting_banner_gifter=true' ) ) {
			giftingBanner();
			bumpStat( 'viewed_total' );

			document.getElementById( 'wpcom-gifting-banner-button' ).onclick = function () {
				bumpStat( 'clicked' );
				window.location.href = gifting_banner.checkout_link;
			};
			document.getElementById( 'wpcom-gifting-banner-more-info-button' ).onclick = function () {
				bumpStat( 'moreinfo' );
				window.open( gifting_banner.more_info_link, '_blank' );
			};
		}
	} );

	/**
	 * Prepend the gifting banner to the document body.
	 */
	function giftingBanner() {
		// Check for hash in URL to see if we should dismiss the banner
		const hash = location.hash;
		if ( '#gift-thank-you' === hash ) {
			const expiration = new Date();
			expiration.setTime(
				expiration.getTime() + 1000 * 60 * 60 * 24 * gifting_banner.dismiss_days_count
			);
			const expires = 'expires=' + expiration.toUTCString();
			document.cookie = 'wpcom_gifting_banner_gifter=true;' + expires + ';path=/';
			location.hash = '';
			return;
		}
		const notice = document.createElement( 'div' );
		notice.setAttribute( 'id', 'wpcom-gifting-banner' );
		notice.classList.add( 'wpcom-gifting-banner' );
		document.documentElement.classList.add( 'has-wpcom-gifting-banner' );
		notice.innerHTML =
			'<div class="wpcom-gifting-banner__inner">' +
			'<svg class="wpcom-gifting-banner__logo" xmlns="http://www.w3.org/2000/svg">\
				<path d="M12.158,12.786L9.46,20.625c0.806,0.237,1.657,0.366,2.54,0.366c1.047,0,2.051-0.181,2.986-0.51 \
					c-0.024-0.038-0.046-0.079-0.065-0.124L12.158,12.786z M3.009,12c0,3.559,2.068,6.634,5.067,8.092L3.788,8.341\
					C3.289,9.459,3.009,10.696,3.009,12z M18.069,11.546c0-1.112-0.399-1.881-0.741-2.48c-0.456-0.741-0.883-1.368-0.883-2.109\
					c0-0.826,0.627-1.596,1.51-1.596c0.04,0,0.078,0.005,0.116,0.007C16.472,3.904,14.34,3.009,12,3.009\
					c-3.141,0-5.904,1.612-7.512,4.052c0.211,0.007,0.41,0.011,0.579,0.011c0.94,0,2.396-0.114,2.396-0.114\
					C7.947,6.93,8.004,7.642,7.52,7.699c0,0-0.487,0.057-1.029,0.085l3.274,9.739l1.968-5.901l-1.401-3.838\
					C9.848,7.756,9.389,7.699,9.389,7.699C8.904,7.67,8.961,6.93,9.446,6.958c0,0,1.484,0.114,2.368,0.114\
					c0.94,0,2.397-0.114,2.397-0.114c0.485-0.028,0.542,0.684,0.057,0.741c0,0-0.488,0.057-1.029,0.085l3.249,9.665l0.897-2.996\
					C17.841,13.284,18.069,12.316,18.069,11.546z M19.889,7.686c0.039,0.286,0.06,0.593,0.06,0.924c0,0.912-0.171,1.938-0.684,3.22\
					l-2.746,7.94c2.673-1.558,4.47-4.454,4.47-7.771C20.991,10.436,20.591,8.967,19.889,7.686z M12,22C6.486,22,2,17.514,2,12\
					C2,6.486,6.486,2,12,2c5.514,0,10,4.486,10,10C22,17.514,17.514,22,12,22z" transform="scale(1.2)"/>\
			</svg>' +
			'<div class="wpcom-gifting-banner__wrapper">' +
			'<span class="wpcom-gifting-banner__title"></span>' +
			'<img class="wpcom-gifting-banner__img" alt="🎁" src="https://s.w.org/images/core/emoji/14.0.0/svg/1f381.svg"/>' +
			'<span class="wpcom-gifting-banner__subtitle"></span>' +
			'</div>' +
			'<button id="wpcom-gifting-banner-button" class="wpcom-gifting-banner__button"></button>' +
			'</div>';

		const title = document.createTextNode( gifting_banner.i18n.title );
		const subtitle = document.createTextNode( gifting_banner.i18n.subtitle );
		const more_info_button = document.createElement( 'BUTTON' );
		more_info_button.setAttribute( 'id', 'wpcom-gifting-banner-more-info-button' );
		more_info_button.setAttribute( 'class', 'wpcom-gifting-banner__more-info-button' );
		const button_text = document.createTextNode( gifting_banner.i18n.button_text );

		notice.getElementsByClassName( 'wpcom-gifting-banner__title' )[ 0 ].appendChild( title );
		notice.getElementsByClassName( 'wpcom-gifting-banner__subtitle' )[ 0 ].appendChild( subtitle );
		notice
			.getElementsByClassName( 'wpcom-gifting-banner__subtitle' )[ 0 ]
			.appendChild( more_info_button );
		notice.getElementsByClassName( 'wpcom-gifting-banner__button' )[ 0 ].appendChild( button_text );

		document.body.prepend( notice );
	}
} )();
