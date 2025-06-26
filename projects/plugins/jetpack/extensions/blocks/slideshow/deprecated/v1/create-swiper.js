import './style.scss';

export default async function createSwiper(
	container = '.swiper-container',
	params = {},
	callbacks = {}
) {
	const defaultParams = {
		effect: 'slide',
		grabCursor: true,
		init: true,
		initialSlide: 0,
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		},
		pagination: {
			bulletElement: 'button',
			clickable: true,
			el: '.swiper-pagination',
			type: 'bullets',
		},
		preventClicks: false,
		preventClicksPropagation: false, // Necessary for normal block operations.
		releaseFormElements: false,
		setWrapperSize: true,
		threshold: 5, // This value helps avoid clicks being treated as swipe actions.
		touchStartPreventDefault: false,
		on: Object.fromEntries(
			Object.entries( callbacks || {} ).map( ( [ key, callback ] ) => [
				key,
				function () {
					callback( this );
				},
			] )
		),
	};

	let Swiper;
	if ( window.JetpackSwiper ) {
		// Load Swiper from window scope.
		Swiper = window.JetpackSwiper;
	} else {
		// Load the file.
		await import( /* webpackIgnore: true */ window.Jetpack_Block_Assets_Base_Url + 'swiper.js' );

		if ( ! window.JetpackSwiper ) {
			throw new Error( 'Failed to load Jetpack Swiper bundle' );
		}

		Swiper = window.JetpackSwiper;
	}

	return new Swiper( container, { ...defaultParams, ...params } );
}
