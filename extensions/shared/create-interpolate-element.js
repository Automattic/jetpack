/**
 * External dependencies
 */
import {
	createInterpolateElement,
	__experimentalCreateInterpolateElement,
} from '@wordpress/element';

/**
 * createInterpolateElement is available in WordPress 5.5
 * and in latest versions of the Gutenberg plugin,
 * but it is not available in WordPress 5.4, which we still support.
 *
 * @todo remove when Jetpack requires WordPress 5.5.
 */
export const jetpackCreateInterpolateElement =
	createInterpolateElement || __experimentalCreateInterpolateElement;
