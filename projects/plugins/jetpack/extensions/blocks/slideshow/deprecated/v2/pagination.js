import { __, sprintf } from '@wordpress/i18n';

export function paginationCustomRender( swiper, current, total ) {
	let markup = '';

	// Print dots pagination when total slides are less than six.
	if ( total <= 5 ) {
		for ( let i = 1; i <= total; i++ ) {
			const active = i === current ? ' swiper-pagination-bullet-active' : '';
			const cssClass = `swiper-pagination-bullet${ active }`;
			const ariaLabel = sprintf(
				/* translators: placeholder is the the video number to navigate to */
				__( 'Go to slide %s', 'jetpack' ),
				i
			);

			markup +=
				'<button ' +
				'class="' +
				cssClass +
				'" ' +
				'tab-index="0" ' +
				'role="button" ' +
				'aria-label="' +
				ariaLabel +
				'"></button>';
		}
	} else {
		markup += `<div class="swiper-pagination-simple">${ current } / ${ total }</div>`;
	}

	return markup;
}
