/**
 * This test is for touch events.
 * It may not accurately detect a touch screen, but may be close enough depending on the use case.
 *
 * @copyright Modernizr © 2009-2015.
 * @license MIT
 * @see https://github.com/Modernizr/Modernizr/blob/d5f881a4de0d5fc1af85921ce9c7dc3919c6d335/feature-detects/touchevents.js
 *
 * @return {boolean} whether touch screen is available
 */
export function hasTouch() {
	/* global DocumentTouch:true */
	return 'ontouchstart' in window || ( window.DocumentTouch && document instanceof DocumentTouch );
}
