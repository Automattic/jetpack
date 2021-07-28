/**
 * External dependencies
 */
import { mapValues, merge } from 'lodash';

/**
 * Internal dependencies
 */
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
		touchStartPreventDefault: false,
		threshold: 5, // This value helps avoid clicks being treated as swipe actions.
		on: mapValues(
			callbacks,
			callback =>
				function () {
					callback( this );
				}
		),
	};
	const [ { default: Swiper } ] = await Promise.all( [
		import( /* webpackChunkName: "swiper" */ 'swiper/swiper-bundle.js' ),
		import( /* webpackChunkName: "swiper" */ 'swiper/swiper-bundle.css' ),
	] );
	return new Swiper( container, merge( {}, defaultParams, params ) );
}
