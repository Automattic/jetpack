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
			<SVG version="1.1" xmlns="http://www.w3.org/2000/svg">
				<filter id="gaussian-blur-10">
					<feGaussianBlur stdDeviation="10" />
				</filter>
			</SVG>
			<img src={ url } alt="" />
			<div className="wp-story-background-blur"></div>
		</div>
	);
}
