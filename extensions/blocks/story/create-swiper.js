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
		cssMode: false, // true seems to mess up when blur/focus
		speed: 0,
		grabCursor: true,
		init: true,
		initialSlide: 0,
		loop: false,
		pagination: {
			clickable: true,
			renderBullet: function( index, className ) {
				return `<button class="${ className }" tab-index=${ index } role="button" aria-label="Go to slide ${ index }">
							<div class="swiper-pagination-bullet-bar">
								<div class="swiper-pagination-bullet-bar-progress"></div>
							</div>
						</button>`;
			},
		},
		preventClicksPropagation: false /* Necessary for normal block interactions */,
		releaseFormElements: false,
		setWrapperSize: true,
		touchStartPreventDefault: false,
		on: mapValues(
			callbacks,
			callback =>
				function() {
					callback( this );
				}
		),
	};
	const [ { default: Swiper } ] = await Promise.all( [
		import( /* webpackChunkName: "swiper" */ 'swiper/dist/js/swiper.js' ),
		import( /* webpackChunkName: "swiper" */ 'swiper/dist/css/swiper.css' ),
	] );
	return new Swiper( container, merge( {}, defaultParams, params ) );
}
