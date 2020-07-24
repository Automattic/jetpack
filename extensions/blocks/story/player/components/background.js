/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import { SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */

export default function Background( { currentMedia } ) {
	const url = currentMedia.type === 'image' ? currentMedia.url : null;

	return (
		<div className="wp-story-background">
			<div
				className="wp-story-background-image"
				style={ { backgroundImage: `url("${ url }")` } }
			></div>
			<div className="wp-story-background-blur"></div>
			<SVG version="1.1" xmlns="http://www.w3.org/2000/svg">
				<filter id="gaussian-blur-18">
					<feGaussianBlur stdDeviation="18" />
				</filter>
			</SVG>
		</div>
	);
}
