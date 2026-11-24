<?php
/**
 * A plain stand-in for a Jetpack page whose feature is switched off.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Tracking;
use WP_Error;

/**
 * Most features stop registering their admin page when they are switched off, so a saved link
 * or a stale sidebar item would end on core's "not allowed" error. This page offers to turn the
 * feature back on instead.
 */
class Turned_Off_Page {

	/**
	 * The admin-post action the page's button posts to.
	 */
	const ACTION = 'jetpack_my_jetpack_turn_feature_on';

	/**
	 * Query argument the page reads an activation failure from.
	 */
	const ERROR_ARG = 'jetpack_turn_on_error';

	/**
	 * The admin-ajax action the card reports that it was seen to, so Tracks' request doesn't hold up the page.
	 */
	const VIEW_ACTION = 'jetpack_my_jetpack_feature_off_view';

	/**
	 * The card's script: reports the view, shows Turn on is under way, and drops a failed Turn on's error from the URL.
	 *
	 * Runs again each time the admin shell inserts the card. Back from the feature's page restores this one from the bfcache, still busy, hence pageshow.
	 */
	const SCRIPT = '( function ( card ) {
		var data = new FormData();
		data.append( "action", "jetpack_my_jetpack_feature_off_view" );
		data.append( "_wpnonce", card.dataset.trackNonce );
		data.append( "feature", card.dataset.feature );
		data.append( "context", card.dataset.context );
		data.append( "error", card.dataset.error );
		if ( navigator.sendBeacon ) {
			navigator.sendBeacon( card.dataset.trackUrl, data );
		}
		var url = new URL( location.href );
		if ( url.searchParams.has( "jetpack_turn_on_error" ) ) {
			url.searchParams.delete( "jetpack_turn_on_error" );
			history.replaceState( history.state, "", url );
		}
		var form = card.querySelector( "form" );
		if ( ! form ) {
			return;
		}
		var button = form.querySelector( "[type=submit]" ), label = button.value;
		function busy( on ) {
			button.disabled = on;
			button.value = on ? button.dataset.busy : label;
			form.classList.toggle( "is-busy", on );
			form.setAttribute( "aria-busy", on ? "true" : "false" );
		}
		function restore( event ) {
			if ( ! form.isConnected ) {
				window.removeEventListener( "pageshow", restore );
			} else if ( event.persisted ) {
				busy( false );
			}
		}
		form.addEventListener( "submit", function () { busy( true ); } );
		window.addEventListener( "pageshow", restore );
	} )( document.currentScript.previousElementSibling );';

	/**
	 * The feature the requested page belongs to, while the stand-in is registered.
	 *
	 * @var array|null
	 */
	private static $feature = null;

	/**
	 * The product marks the Features tab shows, without their dark tile, keyed by product; rendered from `_inc/components/products-table-view/icons`.
	 * `features/test/turned-off-card-icons.test.tsx` fails when either list drifts from the Features tab.
	 */
	const PRODUCT_ICONS = array(
		'anti-spam'     => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#jetpack-feature-off-clip)"><path d="M34.214 21.6924L40.7619 38.9784C41.3267 40.4574 42.1943 40.9935 43.6778 41.1189C43.732 41.1213 43.7851 41.1349 43.8339 41.1588C43.8827 41.1828 43.926 41.2164 43.9613 41.2578C43.9966 41.2992 44.023 41.3474 44.039 41.3995C44.055 41.4516 44.0602 41.5063 44.0543 41.5605C44.0565 41.6164 44.0476 41.6722 44.0282 41.7247C44.0087 41.7771 43.9791 41.8252 43.9411 41.866C43.903 41.9069 43.8572 41.9398 43.8064 41.9628C43.7556 41.9858 43.7008 41.9985 43.6451 42.0001H36.473C36.415 42.0015 36.3574 41.9911 36.3035 41.9695C36.2496 41.948 36.2007 41.9157 36.1596 41.8746C36.1185 41.8335 36.0861 41.7845 36.0643 41.7305C36.0426 41.6765 36.032 41.6187 36.0331 41.5605C36.0288 41.504 36.0363 41.4473 36.055 41.3938C36.0736 41.3403 36.1031 41.2913 36.1415 41.2499C36.18 41.2084 36.2265 41.1753 36.2783 41.1528C36.33 41.1302 36.3859 41.1187 36.4423 41.1189C37.1626 41.1189 37.979 40.9299 37.979 40.0486C37.9727 39.6811 37.8977 39.3181 37.758 38.9784L36.1865 34.7899C36.1231 34.6009 36.0924 34.5372 35.9042 34.5372H29.9189C28.9777 34.5372 27.8175 34.5372 27.2834 35.7348L25.851 38.9784C25.7054 39.2727 25.6198 39.5933 25.5994 39.9213C25.5994 41.0552 27.0747 41.1189 27.8502 41.1189C27.9066 41.1187 27.9625 41.1302 28.0142 41.1528C28.066 41.1753 28.1126 41.2084 28.151 41.2499C28.1894 41.2913 28.2189 41.3403 28.2376 41.3938C28.2562 41.4473 28.2637 41.504 28.2595 41.5605C28.2606 41.6188 28.2499 41.6767 28.228 41.7307C28.2061 41.7847 28.1735 41.8337 28.1322 41.8747C28.0908 41.9156 28.0416 41.9477 27.9875 41.9689C27.9334 41.9901 27.8755 42 27.8175 41.998H21.4537C21.3958 41.9995 21.3382 41.989 21.2845 41.9674C21.2307 41.9459 21.1819 41.9135 21.1409 41.8724C21.1 41.8313 21.0678 41.7823 21.0463 41.7283C21.0248 41.6744 21.0144 41.6166 21.0158 41.5584C21.0116 41.502 21.019 41.4452 21.0377 41.3917C21.0563 41.3383 21.0858 41.2893 21.1242 41.2478C21.1627 41.2063 21.2092 41.1733 21.261 41.1507C21.3128 41.1282 21.3686 41.1166 21.425 41.1168C22.9618 41.0223 23.4713 40.2951 24.0585 38.9763L31.6173 22.3518C31.9631 21.6266 32.7161 20.998 33.4057 20.998C33.9009 21.0001 34.0585 21.2836 34.214 21.6924ZM28.4845 32.9637C28.4466 33.0197 28.4247 33.0851 28.4211 33.1527C28.4211 33.2164 28.4845 33.2472 28.6094 33.2472H34.8197C35.2576 33.2472 35.4458 33.1527 35.4458 32.8692C35.4452 32.727 35.4131 32.5866 35.3517 32.4584L33.6267 27.7974C33.2175 26.7272 32.6241 25.3118 32.4358 24.1451C32.4358 24.0834 32.4031 24.0506 32.3724 24.0506C32.3417 24.0506 32.311 24.0834 32.311 24.1451C32.0755 24.9473 31.7708 25.7274 31.4004 26.4766L28.4845 32.9637Z" fill="currentColor"></path><path d="M34.214 21.6924L40.7619 38.9784C41.3267 40.4574 42.1943 40.9935 43.6778 41.1189C43.732 41.1213 43.7851 41.1349 43.8339 41.1589C43.8827 41.1828 43.926 41.2164 43.9613 41.2578C43.9966 41.2992 44.023 41.3474 44.039 41.3995C44.055 41.4516 44.0602 41.5063 44.0543 41.5605C44.0565 41.6164 44.0476 41.6722 44.0282 41.7247C44.0087 41.7771 43.9791 41.8252 43.9411 41.866C43.903 41.9069 43.8572 41.9398 43.8064 41.9628C43.7556 41.9858 43.7008 41.9985 43.6451 42.0001H36.473C36.415 42.0015 36.3574 41.9911 36.3035 41.9695C36.2496 41.948 36.2007 41.9157 36.1596 41.8746C36.1185 41.8335 36.0861 41.7845 36.0643 41.7305C36.0426 41.6766 36.032 41.6187 36.0331 41.5605C36.0288 41.504 36.0363 41.4473 36.055 41.3938C36.0736 41.3403 36.1031 41.2913 36.1415 41.2499C36.18 41.2084 36.2265 41.1753 36.2783 41.1528C36.33 41.1302 36.3859 41.1187 36.4423 41.1189C37.1626 41.1189 37.979 40.9299 37.979 40.0486C37.9727 39.6811 37.8977 39.3181 37.758 38.9784L36.1865 34.7899C36.1231 34.6009 36.0924 34.5372 35.9042 34.5372H29.9189C28.9777 34.5372 27.8175 34.5372 27.2834 35.7348L25.851 38.9784C25.7054 39.2727 25.6198 39.5933 25.5994 39.9213C25.5994 41.0552 27.0747 41.1189 27.8502 41.1189C27.9066 41.1187 27.9625 41.1302 28.0142 41.1528C28.066 41.1753 28.1126 41.2084 28.151 41.2499C28.1894 41.2913 28.2189 41.3403 28.2376 41.3938C28.2562 41.4473 28.2637 41.504 28.2595 41.5605C28.2606 41.6188 28.2499 41.6767 28.228 41.7307C28.2061 41.7847 28.1735 41.8337 28.1322 41.8747C28.0908 41.9156 28.0416 41.9477 27.9875 41.9689C27.9334 41.9901 27.8755 42 27.8175 41.998H21.4537C21.3958 41.9995 21.3382 41.989 21.2845 41.9675C21.2307 41.9459 21.1819 41.9135 21.1409 41.8724C21.1 41.8313 21.0678 41.7823 21.0463 41.7283C21.0248 41.6744 21.0144 41.6166 21.0158 41.5584C21.0116 41.502 21.019 41.4452 21.0377 41.3918C21.0563 41.3383 21.0858 41.2893 21.1242 41.2478C21.1627 41.2063 21.2092 41.1733 21.261 41.1507C21.3128 41.1282 21.3686 41.1166 21.425 41.1168C22.9618 41.0223 23.4713 40.2951 24.0585 38.9763L31.6173 22.3518C31.9631 21.6266 32.7161 20.998 33.4057 20.998C33.9009 21.0001 34.0585 21.2836 34.214 21.6924ZM28.4845 32.9637C28.4466 33.0197 28.4247 33.0851 28.4211 33.1527C28.4211 33.2164 28.4845 33.2472 28.6094 33.2472H34.8197C35.2576 33.2472 35.4458 33.1527 35.4458 32.8692C35.4452 32.727 35.4131 32.5866 35.3517 32.4584L33.6267 27.7974C33.2175 26.7272 32.6241 25.3118 32.4358 24.1451C32.4358 24.0834 32.4031 24.0506 32.3724 24.0506C32.3417 24.0506 32.311 24.0834 32.311 24.1451C32.0755 24.9473 31.7708 25.7274 31.4004 26.4766L28.4845 32.9637Z" fill="currentColor"></path><path d="M46.0082 32.2219C46.0082 33.0312 45.5519 33.4893 44.7272 33.4893C43.9026 33.4893 43.5752 33.0682 43.5752 32.4252C43.5752 31.6159 44.052 31.1578 44.8561 31.1578C45.6603 31.1578 46.0082 31.5974 46.0082 32.2219Z" fill="currentColor"></path><path d="M21.4351 32.2487C21.4351 33.056 20.9768 33.5162 20.1542 33.5162C19.3316 33.5162 18.998 33.093 18.998 32.4501C18.998 31.6428 19.4748 31.1826 20.279 31.1826C21.0832 31.1826 21.4351 31.6243 21.4351 32.2487Z" fill="currentColor"></path></g><defs><clipPath id="jetpack-feature-off-clip"><rect width="27" height="21" fill="white" transform="translate(19 21)"></rect></clipPath></defs></svg>',
		'backup'        => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M26.5118 27.9597C26.4453 27.957 26.3784 27.9556 26.3113 27.9556C23.5621 27.9556 21.3335 30.2539 21.3335 33.0889C21.3335 35.924 23.5621 38.2223 26.3113 38.2223L26.3409 38.2221H38.376L38.3996 38.2223C40.756 38.2223 42.6663 36.2523 42.6663 33.8223C42.6663 31.6421 41.1288 29.8323 39.111 29.4831L39.1112 29.4223C39.1112 26.1823 36.2459 23.5557 32.7112 23.5557C29.7275 23.5557 27.2207 25.4273 26.5118 27.9597C26.5118 27.9597 26.5118 27.9597 26.5118 27.9597ZM37.0923 31.1635L37.1111 29.4609L37.1112 29.4223C37.1112 27.4471 35.3087 25.5557 32.7112 25.5557C30.5416 25.5557 28.8833 26.9074 28.4377 28.4989L28.0111 30.0227L26.4301 29.958C26.3908 29.9564 26.3512 29.9556 26.3113 29.9556C24.7243 29.9556 23.3335 31.3 23.3335 33.0889C23.3335 34.876 24.7213 36.2194 26.3063 36.2223L26.3349 36.2221H38.3874L38.3996 36.2223C39.5939 36.2223 40.6663 35.2061 40.6663 33.8223C40.6663 32.5872 39.8018 31.6324 38.7699 31.4539L37.0923 31.1635Z" fill="currentColor"></path></svg>',
		'boost'         => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M37.3154 32L31.2603 25.3393L32.7401 23.994L40.0183 32L32.7401 40.006L31.2603 38.6606L37.3154 32ZM29.3154 32L23.2603 25.3393L24.7401 23.994L32.0183 32L24.7401 40.006L23.2603 38.6606L29.3154 32Z" fill="currentColor"></path></svg>',
		'jetpack-ai'    => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.5 20L25.7728 23.2272L29 24.5L25.7728 25.7728L24.5 29L23.2272 25.7728L20 24.5L23.2272 23.2272L24.5 20Z" fill="currentColor"></path><path d="M38 20L39.6971 24.3029L44 26L39.6971 27.6971L38 32L36.3029 27.6971L32 26L36.3029 24.3029L38 20Z" fill="currentColor"></path><path d="M30.5 29L32.6213 34.3787L38 36.5L32.6213 38.6213L30.5 44L28.3787 38.6213L23 36.5L28.3787 34.3787L30.5 29Z" fill="currentColor"></path></svg>',
		'jetpack-forms' => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(20, 20)" fill="currentColor"><path d="m13 7.5 h 5 v 1.5 h -5 v -1.5z"></path><path d="m13 15 h 5 v 1.5 h -5 v -1.5z"></path><path d="m19.01,3H4.99c-1.1,0-1.99.89-1.99,1.99v14.02c0,1.1.89,1.99,1.99,1.99h14.02c1.1,0,1.99-.89,1.99-1.99V4.99c0-1.1-.89-1.99-1.99-1.99Zm.49,15.99c0,.28-.23.51-.51.51H5.01c-.28,0-.51-.23-.51-.51V5.01c0-.28.23-.51.51-.51h13.98c.28,0,.51.23.51.51v13.98Z"></path><path d="m9.46,13h-1.92c-.85,0-1.54.69-1.54,1.54v1.92c0,.85.69,1.54,1.54,1.54h1.92c.85,0,1.54-.69,1.54-1.54v-1.92c0-.85-.69-1.54-1.54-1.54Zm.04,3.5h-2v-2h2v2Z"></path><path d="m9.46,6h-1.92c-.85,0-1.54.69-1.54,1.54v1.92c0,.85.69,1.54,1.54,1.54h1.92c.85,0,1.54-.69,1.54-1.54v-1.92c0-.85-.69-1.54-1.54-1.54Zm.04,3.5h-2v-2h2v2Z"></path></g></svg>',
		'crm'           => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M36.6667 30.6667C38.5076 30.6667 40 29.1743 40 27.3333C40 25.4924 38.5076 24 36.6667 24C34.8257 24 33.3333 25.4924 33.3333 27.3333C33.3333 29.1743 34.8257 30.6667 36.6667 30.6667ZM36.6667 28.6667C37.403 28.6667 38 28.0697 38 27.3333C38 26.597 37.403 26 36.6667 26C35.9303 26 35.3333 26.597 35.3333 27.3333C35.3333 28.0697 35.9303 28.6667 36.6667 28.6667Z" fill="currentColor"></path><path d="M33.6667 38.6667V36C33.6667 33.975 32.025 32.3333 30 32.3333H24.6667C22.6416 32.3333 21 33.975 21 36V38.6667H23V36C23 35.0795 23.7462 34.3333 24.6667 34.3333H30C30.9205 34.3333 31.6667 35.0795 31.6667 36V38.6667H33.6667Z" fill="currentColor"></path><path d="M43 36V38.6667H41V36C41 35.0795 40.2538 34.3333 39.3333 34.3333H36V32.3333H39.3333C41.3584 32.3333 43 33.975 43 36Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M30.6667 27.3333C30.6667 29.1743 29.1743 30.6667 27.3333 30.6667C25.4924 30.6667 24 29.1743 24 27.3333C24 25.4924 25.4924 24 27.3333 24C29.1743 24 30.6667 25.4924 30.6667 27.3333ZM28.6667 27.3333C28.6667 28.0697 28.0697 28.6667 27.3333 28.6667C26.597 28.6667 26 28.0697 26 27.3333C26 26.597 26.597 26 27.3333 26C28.0697 26 28.6667 26.597 28.6667 27.3333Z" fill="currentColor"></path></svg>',
		'protect'       => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M32 20.2349L41 24.3258V30.4242C41 35.6229 37.6611 40.545 32.9529 42.0978C32.3343 42.3019 31.6657 42.3019 31.0471 42.0978C26.3389 40.545 23 35.6229 23 30.4242V24.3258L32 20.2349ZM25 25.6136V30.4242C25 34.8415 27.8602 38.9408 31.6735 40.1985C31.8853 40.2683 32.1147 40.2683 32.3265 40.1985C36.1398 38.9408 39 34.8415 39 30.4242V25.6136L32 22.4318L25 25.6136Z" fill="currentColor"></path></svg>',
		'search'        => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M42 30.2586C42 34.8196 38.3025 38.5171 33.7414 38.5171C31.833 38.5171 30.0757 37.8698 28.6772 36.7827L23.4599 42L22 40.5401L27.2173 35.3228C26.1302 33.9243 25.4828 32.167 25.4828 30.2586C25.4828 25.6975 29.1803 22 33.7414 22C38.3025 22 42 25.6975 42 30.2586ZM39.9354 30.2586C39.9354 33.6794 37.1622 36.4525 33.7414 36.4525C30.3206 36.4525 27.5475 33.6794 27.5475 30.2586C27.5475 26.8377 30.3206 24.0646 33.7414 24.0646C37.1622 24.0646 39.9354 26.8377 39.9354 30.2586Z" fill="currentColor"></path></svg>',
		'social'        => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M35.9287 23.8145V37.553L27.832 35.1813V39.4872H26.314V34.7366L23.557 33.929C22.4903 33.6165 21.7607 32.666 21.7607 31.5884V29.7791C21.7607 28.7015 22.4903 27.751 23.557 27.4385L35.9287 23.8145ZM34.4107 35.5751L27.832 33.648L27.832 27.7195L34.4107 25.7924V35.5751ZM26.314 28.1642L26.314 33.2033L23.9973 32.5247C23.5705 32.3997 23.2787 32.0194 23.2787 31.5884V29.7791C23.2787 29.348 23.5705 28.9678 23.9973 28.8428L26.314 28.1642ZM37.9529 31.4183H42.0009V29.9509H37.9529V31.4183ZM42.0009 35.575L37.9529 34.5967V33.1293L42.0009 34.1076V35.575ZM37.9529 28.2384L42.0009 27.2601V25.7927L37.9529 26.771V28.2384Z" fill="currentColor"></path></g></svg>',
		'stats'         => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31 22.6667H33V42.6667H31V22.6667Z" fill="currentColor"></path><path d="M24 29.3333H26V42.6667H24V29.3333Z" fill="currentColor"></path><path d="M40 34.6667H38V42.6667H40V34.6667Z" fill="currentColor"></path></svg>',
		'videopress'    => '<svg aria-hidden="true" focusable="false" viewBox="16 16 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.545 23C22.6814 23 23.6798 23.7522 23.991 24.8427L27.0674 35.6252C27.0705 35.6361 27.0755 35.6461 27.0821 35.6548L30.7267 23H32.7655H38.4016C42.352 23 45 25.5644 45 29.4466C45 33.3733 42.2825 35.8219 38.228 35.8219H35.5539H32.1081L31.4387 37.8894C30.8383 39.7436 29.1082 41 27.1553 41C25.2024 41 23.4722 39.7436 22.8719 37.8894L19.125 26.3175C18.5944 24.6788 19.8191 23 21.545 23ZM33.3536 31.9753H37.2556C38.9486 31.9753 39.9644 31.0048 39.9644 29.4466C39.9644 27.8795 38.9486 26.9534 37.2556 26.9534H34.9796L33.3536 31.9753Z" fill="currentColor"></path></svg>',
	);

	/**
	 * The glyphs the Features tab puts on a tile for features without a product mark; rendered from `@wordpress/icons` via `features/icons.ts`.
	 */
	const GLYPHS = array(
		'audio'           => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M13.25 16.5C13.25 18.0188 12.0188 19.25 10.5 19.25C8.98122 19.25 7.75 18.0188 7.75 16.5C7.75 14.9812 8.98122 13.75 10.5 13.75C12.0188 13.75 13.25 14.9812 13.25 16.5Z" fill="currentColor" stroke="none"></path><path d="M10.5 19.25C12.0188 19.25 13.25 18.0188 13.25 16.5C13.25 14.9812 12.0188 13.75 10.5 13.75C8.98122 13.75 7.75 14.9812 7.75 16.5C7.75 18.0188 8.98122 19.25 10.5 19.25ZM10.5 19.25C13.4867 19.25 13.75 16.5 13.75 15.1379V7.99998C13.75 4.9108 16.4 5.00254 18 5.00233"></path></svg>',
		'backup'          => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M7.59201 17.7565C8.8135 18.6933 10.3417 19.25 12 19.25C16.0041 19.25 19.25 16.0041 19.25 12C19.25 7.99594 16.0041 4.75 12 4.75C7.99594 4.75 4.75 7.99593 4.75 12L4.75 14M14.75 14.75L12.25 12.25L12.25 8M2 12L4.75 14L7.5 12"></path></svg>',
		'chart-bar'       => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M6.75 20V10M12 20V5M17.25 20V14"></path></svg>',
		'comment'         => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M18 5.5H6C5.30964 5.5 4.75 6.05964 4.75 6.75V16V18.4096C4.75 18.8725 5.32471 19.0869 5.62784 18.7371L8 16H18C18.6904 16 19.25 15.4404 19.25 14.75V6.75C19.25 6.05964 18.6904 5.5 18 5.5Z"></path></svg>',
		'currency-dollar' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M14.5 10.25C14.5 9.5 13.6 8.5 12 8.5M12 8.5C8.88026 8.5 8.81164 12 12 12C15.1884 12 15.1197 15.5 12 15.5M12 8.5L12 7.5M9.5 13.75C9.5 14.5 10.4 15.5 12 15.5M12 15.5V16.5" stroke-linecap="round"></path><path d="M19.25 12C19.25 16.0041 16.0041 19.25 12 19.25C7.99594 19.25 4.75 16.0041 4.75 12C4.75 7.99594 7.99594 4.75 12 4.75C16.0041 4.75 19.25 7.99594 19.25 12Z" stroke-linecap="round"></path></svg>',
		'envelope'        => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M20.25 8.5V7C20.25 6.30964 19.6904 5.75 19 5.75H5C4.30964 5.75 3.75 6.30964 3.75 7V8.5M20.25 8.5V17C20.25 17.6904 19.6904 18.25 19 18.25H5C4.30964 18.25 3.75 17.6904 3.75 17V8.5M20.25 8.5L12 14.5L3.75 8.5"></path></svg>',
		'list-bullets'    => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M11 8H20M11 16H20"></path><path d="M6 9.25C6.69036 9.25 7.25 8.69036 7.25 8C7.25 7.30964 6.69036 6.75 6 6.75C5.30964 6.75 4.75 7.30964 4.75 8C4.75 8.69036 5.30964 9.25 6 9.25Z" fill="currentColor" stroke="none"></path><path d="M6 17.25C6.69036 17.25 7.25 16.6904 7.25 16C7.25 15.3096 6.69036 14.75 6 14.75C5.30964 14.75 4.75 15.3096 4.75 16C4.75 16.6904 5.30964 17.25 6 17.25Z" fill="currentColor" stroke="none"></path><path d="M6 9.25C6.69036 9.25 7.25 8.69036 7.25 8C7.25 7.30964 6.69036 6.75 6 6.75C5.30964 6.75 4.75 7.30964 4.75 8C4.75 8.69036 5.30964 9.25 6 9.25Z"></path><path d="M6 17.25C6.69036 17.25 7.25 16.6904 7.25 16C7.25 15.3096 6.69036 14.75 6 14.75C5.30964 14.75 4.75 15.3096 4.75 16C4.75 16.6904 5.30964 17.25 6 17.25Z"></path></svg>',
		'list'            => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M10 17.5H21M6.5 12H17.5M3 6.5H14" stroke-linejoin="round"></path></svg>',
		'megaphone'       => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M13.4999 14.0178C13.4903 15.6665 12.1509 17 10.5 17C8.84315 17 7.5 15.6569 7.5 14C7.5 13.6412 7.56297 13.2972 7.67847 12.9783M7.67847 12.9783L13.4999 14.0178L19 15V7L5 10V12.5L7.67847 12.9783Z"></path></svg>',
		'people'          => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M4.5 17V15C4.5 13.8954 5.39543 13 6.5 13H10.5C11.6046 13 12.5 13.8954 12.5 15V17M15 13H17.5C18.6046 13 19.5 13.8954 19.5 15V17M10.25 8.5C10.25 9.4665 9.4665 10.25 8.5 10.25C7.5335 10.25 6.75 9.4665 6.75 8.5C6.75 7.5335 7.5335 6.75 8.5 6.75C9.4665 6.75 10.25 7.5335 10.25 8.5ZM17.25 8.5C17.25 9.4665 16.4665 10.25 15.5 10.25C14.5335 10.25 13.75 9.4665 13.75 8.5C13.75 7.5335 14.5335 6.75 15.5 6.75C16.4665 6.75 17.25 7.5335 17.25 8.5Z"></path></svg>',
		'search'          => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M5 19L9.28769 14.7123M18.25 11C18.25 13.8995 15.8995 16.25 13 16.25C10.1005 16.25 7.75 13.8995 7.75 11C7.75 8.10051 10.1005 5.75 13 5.75C15.8995 5.75 18.25 8.10051 18.25 11Z"></path></svg>',
		'share'           => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M15.75 5.69118V7C15.75 7.13807 15.8619 7.25 16 7.25H18C18.1381 7.25 18.25 7.13807 18.25 7V5C18.25 4.86193 18.1381 4.75 18 4.75H16C15.8619 4.75 15.75 4.86193 15.75 5V5.69118ZM15.75 5.69118L8.25 11.4265M15.75 18.3088V19C15.75 19.1381 15.8619 19.25 16 19.25H18C18.1381 19.25 18.25 19.1381 18.25 19V17C18.25 16.8619 18.1381 16.75 18 16.75H16C15.8619 16.75 15.75 16.8619 15.75 17V18.3088ZM15.75 18.3088L8.25 12.5735M8.25 11.4265V11C8.25 10.8619 8.13807 10.75 8 10.75H6C5.86193 10.75 5.75 10.8619 5.75 11V13C5.75 13.1381 5.86193 13.25 6 13.25H8C8.13807 13.25 8.25 13.1381 8.25 13V12.5735M8.25 11.4265V12.5735"></path></svg>',
		'shield'          => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M18 6.75V10.5C18 14.4187 15.4956 17.7524 12 18.9879C8.50442 17.7524 6 14.4187 6 10.5V6.75L12 4L18 6.75Z"></path></svg>',
		'star'            => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M12 5.71576L13.6106 8.97924C13.7563 9.27438 14.0379 9.47895 14.3636 9.52628L17.965 10.0496L15.359 12.5899C15.1233 12.8196 15.0157 13.1506 15.0714 13.475L15.6866 17.0619L12.4653 15.3684C12.174 15.2152 11.826 15.2152 11.5347 15.3684L8.31341 17.0619L8.92861 13.475C8.98425 13.1506 8.8767 12.8196 8.64102 12.5899L6.03497 10.0496L9.63644 9.52628C9.96215 9.47895 10.2437 9.27438 10.3894 8.97924L12 5.71576Z" fill="currentColor"></path></svg>',
		'trending-up'     => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M3.5 15.5L9 10L13 14L19 8M14 8H19V13"></path></svg>',
		'video'           => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="M10 15L15 12L10 9V15Z" fill="currentColor" stroke="none"></path><path d="M4.75 6C4.75 5.30964 5.30964 4.75 6 4.75H18C18.6904 4.75 19.25 5.30964 19.25 6V18C19.25 18.6904 18.6904 19.25 18 19.25H6C5.30964 19.25 4.75 18.6904 4.75 18V6Z"></path></svg>',
	);

	/**
	 * The card's styles. They travel with the card, since the admin shell drops it into pages that never loaded them.
	 */
	const STYLES = '.jetpack-feature-off{box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start;max-inline-size:600px;margin-block:48px;margin-inline:auto;padding:24px;background:#fff;border:1px solid #ddd;border-radius:8px}'
		// A wp-build dashboard behind the card paints the page in the menu colour, inline (@wordpress/boot's useSyncBodyBackground).
		. 'body.wp-admin:has(.jetpack-feature-off){background:#f0f0f1!important}'
		. '.jetpack-feature-off__icon{display:block;inline-size:24px;block-size:24px;color:#757575}'
		. '.jetpack-feature-off__icon>svg{display:block;inline-size:100%;block-size:100%}'
		. '.jetpack-feature-off .jetpack-feature-off__title{margin-block:16px 8px;padding:0;font-size:15px;font-weight:600;line-height:1.4;color:#1e1e1e}'
		. '.jetpack-feature-off .jetpack-feature-off__title:focus{outline:none;box-shadow:none}'
		. '.jetpack-feature-off .jetpack-feature-off__text{margin-block:0 16px;font-size:13px;line-height:20px;color:#757575}'
		. '.jetpack-feature-off__form{display:flex;align-items:center;margin:0}'
		. '.jetpack-feature-off__spinner{display:none;inline-size:16px;block-size:16px;margin-inline-start:8px;overflow:visible;animation:jetpack-feature-off-spin 1.4s linear infinite}'
		. '.jetpack-feature-off__form.is-busy .jetpack-feature-off__spinner{display:block}'
		. '.jetpack-feature-off__spinner circle{fill:none;stroke:#ddd;stroke-width:1.5px}'
		. '.jetpack-feature-off__spinner path{fill:none;stroke:var(--wp-admin-theme-color,#3858e9);stroke-width:1.5px;stroke-linecap:round}'
		. '@keyframes jetpack-feature-off-spin{to{transform:rotate(360deg)}}'
		. '.jetpack-feature-off__media{display:flex;align-items:center;justify-content:center;min-block-size:220px;padding:16px;border-radius:4px;background:#f6f7f7 radial-gradient(#d0d0d0 1px,transparent 1px) 0 0/16px 16px}'
		. '.jetpack-feature-off__media img{display:block;inline-size:300px;max-inline-size:100%;block-size:auto}'
		. '.jetpack-feature-off .jetpack-feature-off__error{margin-block:0 16px;font-size:13px;color:#cc1818}'
		. '.jetpack-feature-off .notice,.jetpack-feature-off .updated,.jetpack-feature-off .error,.jetpack-feature-off .update-nag{display:none!important}'
		. '@media (max-width:782px){.jetpack-feature-off{grid-template-columns:minmax(0,1fr);margin-block:24px}.jetpack-feature-off__media{min-block-size:0}}';

	/**
	 * Hook the stand-in up.
	 *
	 * @return void
	 */
	public static function init() {
		// After every Jetpack page has registered, and before core checks the user may open this one.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_register' ), 100000 );
		add_action( 'admin_post_' . self::ACTION, array( __CLASS__, 'handle_turn_on' ) );
		add_filter( 'jetpack_admin_shell_feature_off_card', array( __CLASS__, 'filter_admin_shell_card' ), 10, 2 );
		add_action( 'wp_ajax_' . self::VIEW_ACTION, array( __CLASS__, 'ajax_track_view' ) );
	}

	/**
	 * Register the stand-in when the requested page is missing because its feature is off.
	 *
	 * @return void
	 */
	public static function maybe_register() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks which page this is.
		$page = isset( $_GET['page'] ) && is_string( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		if ( '' === $page || self::is_registered( $page ) ) {
			return;
		}

		$feature = self::get_feature_for_page( $page );
		// A feature something else holds off keeps core's error: turning it on here can't work.
		if ( null === $feature || false !== Menu_Visibility::resolve( $feature['gate'] ) || ! Menu_Visibility::can_offer( $feature['gate'] ) ) {
			return;
		}

		self::$feature = $feature;
		// The feature's own capability is unknown while it is off; Forms, the lowest, needs edit_pages.
		$hookname = add_submenu_page( '', $feature['name'], $feature['name'], 'edit_pages', $page, array( __CLASS__, 'render' ) );
		if ( $hookname ) {
			add_action( 'load-' . $hookname, array( __CLASS__, 'set_title' ) );
			add_action( 'load-' . $hookname, array( __CLASS__, 'remove_admin_notices' ) );
		}
	}

	/**
	 * Name the browser tab after the feature: core finds no title for a page without a parent, so it would read " ‹ Site".
	 *
	 * @return void
	 */
	public static function set_title() {
		$feature = self::$feature;
		if ( null === $feature ) {
			return;
		}
		$GLOBALS['title'] = $feature['name']; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Read by admin-header.php.
	}

	/**
	 * The feature whose page this is, from the Features tab's map.
	 *
	 * @param string $page Admin page slug.
	 * @return array{slug: string, name: string, icon: string, gate: array, setup: string}|null
	 */
	public static function get_feature_for_page( $page ) {
		foreach ( Main_Features::get_feature_definitions() as $slug => $definition ) {
			$pages = array_merge( (array) ( $definition['off_pages'] ?? array() ), isset( $definition['admin_page'] ) ? array( $definition['admin_page'] ) : array() );
			if ( ! in_array( $page, $pages, true ) ) {
				continue;
			}
			$gate = array_filter( array_intersect_key( $definition, array_flip( array( 'product', 'module' ) ) ) );
			return $gate ? array(
				'slug'  => $slug,
				'name'  => $definition['name'],
				'icon'  => $definition['icon'] ?? '',
				'gate'  => $gate,
				// Where My Jetpack sets it up, e.g. adds the free plan Search needs before its module can switch on.
				'setup' => admin_url( 'admin.php?page=my-jetpack#' . ( $definition['interstitial'] ?? '/features' ) ),
			) : null;
		}
		return null;
	}

	/**
	 * Print the stand-in.
	 *
	 * @return void
	 */
	public static function render() {
		if ( ! self::$feature ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only, and only picks one of the messages in the card.
		$error = isset( $_GET[ self::ERROR_ARG ] ) ? sanitize_key( wp_unslash( $_GET[ self::ERROR_ARG ] ) ) : '';
		// core's common.js moves notices to .wp-header-end, or else after the first heading, which is the card's.
		echo '<style>.jetpack-feature-off-page>.notice,.jetpack-feature-off-page>.updated,.jetpack-feature-off-page>.error,.jetpack-feature-off-page>.update-nag,#wpbody-content>.notice,#wpbody-content>.updated,#wpbody-content>.error,#wpbody-content>.update-nag{display:none!important}</style>';
		echo '<div class="wrap jetpack-feature-off-page"><hr class="wp-header-end">' . self::get_card_html( self::$feature, remove_query_arg( self::ERROR_ARG ), $error ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped as it is built.
	}

	/**
	 * Keep every admin notice off the page, so the card is all it shows.
	 *
	 * @return void
	 */
	public static function remove_admin_notices() {
		foreach ( array( 'admin_notices', 'all_admin_notices', 'network_admin_notices', 'user_admin_notices' ) as $hook ) {
			remove_all_actions( $hook );
		}
	}

	/**
	 * The card the admin shell shows in place of a member page whose feature is off.
	 *
	 * @param string $html Card HTML so far.
	 * @param string $page Admin page slug of the member.
	 * @return string
	 */
	public static function filter_admin_shell_card( $html, $page ) {
		$feature = self::get_feature_for_page( (string) $page );
		if ( null === $feature || ! Menu_Visibility::can_offer( $feature['gate'] ) ) {
			return $html;
		}
		// Over admin-ajax, a failed Turn on's error is only in the URL of the page that asked.
		if ( wp_doing_ajax() ) {
			parse_str( (string) wp_parse_url( (string) wp_get_raw_referer(), PHP_URL_QUERY ), $query );
		} else {
			$query = wp_unslash( $_GET ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks the error to show.
		}
		$error = isset( $query['page'] ) && isset( $query[ self::ERROR_ARG ] ) && $page === $query['page'] && is_string( $query[ self::ERROR_ARG ] ) ? sanitize_key( $query[ self::ERROR_ARG ] ) : '';
		return self::get_card_html( $feature, admin_url( 'admin.php?page=' . $page ), $error, 'admin_shell' );
	}

	/**
	 * The card saying a feature is off, with its icon and illustration from the Features tab.
	 *
	 * @param array  $feature  Feature, as get_feature_for_page() returns it.
	 * @param string $redirect Where Turn on sends the user afterwards.
	 * @param string $error    Error code from a failed Turn on, if any.
	 * @param string $context  Where the card shows, `page` or `admin_shell`, for Tracks.
	 * @return string
	 */
	public static function get_card_html( array $feature, $redirect, $error = '', $context = 'page' ) {
		$image = Initializer::get_assets_url() . 'components/my-jetpack-tab-panel/features/images/' . $feature['slug'] . '.webp';
		ob_start();
		?>
		<style><?php echo self::STYLES; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- A constant. ?></style>
		<div class="jetpack-feature-off" data-feature="<?php echo esc_attr( $feature['slug'] ); ?>" data-context="<?php echo esc_attr( $context ); ?>" data-error="<?php echo esc_attr( $error ); ?>" data-track-url="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>" data-track-nonce="<?php echo esc_attr( wp_create_nonce( self::VIEW_ACTION ) ); ?>">
			<div class="jetpack-feature-off__content">
				<span class="jetpack-feature-off__icon"><?php echo self::get_icon_html( $feature ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Constants. ?></span>
				<h1 class="jetpack-feature-off__title">
					<?php
					/* translators: %s is a feature name, e.g. "Forms". */
					echo esc_html( sprintf( __( '%s is off', 'jetpack-my-jetpack' ), $feature['name'] ) );
					?>
				</h1>
				<?php if ( $error ) : ?>
					<p class="jetpack-feature-off__error" role="alert">
						<?php if ( 'not_allowed' === $error ) : ?>
							<?php esc_html_e( 'Your account can’t turn this feature on.', 'jetpack-my-jetpack' ); ?>
						<?php else : ?>
							<?php esc_html_e( 'It could not be turned on here.', 'jetpack-my-jetpack' ); ?>
							<a href="<?php echo esc_url( $feature['setup'] ?? admin_url( 'admin.php?page=my-jetpack#/features' ) ); ?>"><?php esc_html_e( 'Set it up in My Jetpack', 'jetpack-my-jetpack' ); ?></a>
						<?php endif; ?>
					</p>
				<?php endif; ?>
				<?php if ( ! self::can_turn_on( $feature['gate'] ) ) : ?>
					<p class="jetpack-feature-off__text"><?php esc_html_e( 'Ask a site administrator to turn it on.', 'jetpack-my-jetpack' ); ?></p>
				<?php else : ?>
					<p class="jetpack-feature-off__text"><?php esc_html_e( 'It was switched off in My Jetpack. Turning it on brings this page and its menu item back.', 'jetpack-my-jetpack' ); ?></p>
					<form class="jetpack-feature-off__form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<input type="hidden" name="action" value="<?php echo esc_attr( self::ACTION ); ?>" />
						<input type="hidden" name="feature" value="<?php echo esc_attr( $feature['slug'] ); ?>" />
						<input type="hidden" name="redirect" value="<?php echo esc_attr( $redirect ); ?>" />
						<input type="hidden" name="context" value="<?php echo esc_attr( $context ); ?>" />
						<?php wp_nonce_field( self::ACTION, '_wpnonce', false ); ?>
						<?php
						/* translators: %s is a feature name, e.g. "Forms". */
						$busy = sprintf( __( 'Turning on %s…', 'jetpack-my-jetpack' ), $feature['name'] );
						/* translators: %s is a feature name, e.g. "Forms". */
						submit_button( sprintf( __( 'Turn on %s', 'jetpack-my-jetpack' ), $feature['name'] ), 'primary', 'submit', false, array( 'data-busy' => $busy ) );
						?>
						<?php // The @wordpress/components Spinner, which needs React; the card has none. ?>
						<svg class="jetpack-feature-off__spinner" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="50" vector-effect="non-scaling-stroke" /><path d="m 50 0 a 50 50 0 0 1 50 50" vector-effect="non-scaling-stroke" /></svg>
					</form>
				<?php endif; ?>
			</div>
			<div class="jetpack-feature-off__media">
				<?php // Half its 599px width, so it stays sharp on 2x screens. ?>
				<img src="<?php echo esc_url( $image ); ?>" alt="" width="300" height="238" />
			</div>
		</div>
		<?php
		wp_print_inline_script_tag( self::SCRIPT );
		return (string) ob_get_clean();
	}

	/**
	 * The feature's product mark, else its glyph, in the Features tab's green without the dark tile.
	 *
	 * @param array $feature Feature, as get_feature_for_page() returns it.
	 * @return string
	 */
	private static function get_icon_html( array $feature ) {
		$product = $feature['gate']['product'] ?? '';
		if ( isset( self::PRODUCT_ICONS[ $product ] ) ) {
			return self::PRODUCT_ICONS[ $product ];
		}
		return self::GLYPHS[ $feature['icon'] ] ?? self::GLYPHS['list'];
	}

	/**
	 * Record that a card was seen, as the card reports it.
	 *
	 * @return void
	 */
	public static function ajax_track_view() {
		check_ajax_referer( self::VIEW_ACTION );
		$feature = isset( $_POST['feature'] ) && is_string( $_POST['feature'] ) ? sanitize_key( wp_unslash( $_POST['feature'] ) ) : '';
		$context = isset( $_POST['context'] ) && 'admin_shell' === $_POST['context'] ? 'admin_shell' : 'page';
		$error   = isset( $_POST['error'] ) && is_string( $_POST['error'] ) ? sanitize_key( wp_unslash( $_POST['error'] ) ) : '';
		if ( ! isset( Main_Features::get_feature_definitions()[ $feature ] ) ) {
			wp_send_json_error( null, 400, JSON_UNESCAPED_SLASHES );
		}
		self::track( 'view', $feature, $context, array( 'error' => $error ) );
		wp_send_json_success( null, 200, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * Turn the feature on, then send the user back to its page.
	 *
	 * @return never
	 */
	public static function handle_turn_on() {
		check_admin_referer( self::ACTION );
		$slug     = isset( $_POST['feature'] ) ? sanitize_key( wp_unslash( $_POST['feature'] ) ) : '';
		$redirect = isset( $_POST['redirect'] ) ? wp_validate_redirect( esc_url_raw( wp_unslash( $_POST['redirect'] ) ), admin_url() ) : admin_url();

		$context = isset( $_POST['context'] ) ? sanitize_key( wp_unslash( $_POST['context'] ) ) : 'page';

		$result = self::turn_on( $slug );
		self::track( 'turn_on_click', $slug, $context, array( 'result' => is_wp_error( $result ) ? $result->get_error_code() : 'on' ) );
		if ( is_wp_error( $result ) ) {
			$redirect = add_query_arg( self::ERROR_ARG, 'not_allowed' === $result->get_error_code() ? 'not_allowed' : 'failed', $redirect );
		}

		wp_safe_redirect( $redirect );
		exit;
	}

	/**
	 * Turn a feature on by its slug in the Features tab's map.
	 *
	 * @param string $slug Feature slug.
	 * @return true|WP_Error
	 */
	public static function turn_on( $slug ) {
		$gate = self::get_gate( $slug );
		if ( ! $gate ) {
			return new WP_Error( 'not_found', __( 'That feature was not found.', 'jetpack-my-jetpack' ) );
		}
		return Menu_Visibility::activate( $gate );
	}

	/**
	 * Record a Tracks event, `jetpack_myjetpack_feature_off_<event>`.
	 *
	 * @param string $event   Event name after the prefix.
	 * @param string $feature Feature slug.
	 * @param string $context `page` or `admin_shell`.
	 * @param array  $props   Further properties.
	 * @return void
	 */
	private static function track( $event, $feature, $context, array $props = array() ) {
		( new Tracking( 'jetpack' ) )->record_user_event(
			'myjetpack_feature_off_' . $event,
			array_merge(
				array(
					'feature'     => $feature,
					'context'     => $context,
					'can_turn_on' => self::can_turn_on( self::get_gate( $feature ) ),
				),
				$props
			)
		);
	}

	/**
	 * Whether the current user can turn this gate's feature on.
	 *
	 * @param array $gate The feature's product or module gate.
	 * @return bool
	 */
	public static function can_turn_on( array $gate ) {
		return $gate && Menu_Visibility::can_activate( $gate );
	}

	/**
	 * A feature's product or module gate, from the Features tab's map.
	 *
	 * @param string $slug Feature slug.
	 * @return array Empty when no feature has that slug.
	 */
	private static function get_gate( $slug ) {
		$definition = Main_Features::get_feature_definitions()[ $slug ] ?? null;
		return $definition ? array_filter( array_intersect_key( $definition, array_flip( array( 'product', 'module' ) ) ) ) : array();
	}

	/**
	 * Whether any plugin registered an admin page under this slug.
	 *
	 * @param string $page Admin page slug.
	 * @return bool
	 */
	private static function is_registered( $page ) {
		foreach ( array_keys( (array) ( $GLOBALS['_registered_pages'] ?? array() ) ) as $hookname ) {
			if ( str_ends_with( $hookname, '_page_' . $page ) ) {
				return true;
			}
		}
		return false;
	}
}
