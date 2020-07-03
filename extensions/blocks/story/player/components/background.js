/**
 * External dependencies
 */
import { html } from 'htm/preact';

/**
 * Internal dependencies
 */

export default function Background( { currentMedia } ) {
	const url = currentMedia.type === 'image' ? currentMedia.url : null;

	return html`
		<div class="wp-story-background">
			<svg version="1.1" xmlns="http://www.w3.org/2000/svg">
				<filter id="gaussian-blur-10">
					<feGaussianBlur stdDeviation="10" />
				</filter>
			</svg>
			<img src=${url} alt="" />
			<div class="wp-story-background-blur"></div>
		</div>
	`;
}
