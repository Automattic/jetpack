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
			<img src=${url} alt="" />
			<div class="wp-story-background-blur"></div>
		</div>
	`;
}
