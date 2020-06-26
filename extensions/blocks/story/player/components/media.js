/**
 * External dependencies
 */
import { html } from 'htm/preact';

export const Image = ( { alt, url, id, mime, index, mediaRef } ) => html`
	<img
		ref=${mediaRef}
		data-id=${id}
		data-mime=${mime}
		alt=${alt}
		src=${url}
		class="wp-story-image wp-image-${index}"
	/>
`;

export const Video = ( { alt, mime, url, id, index, mediaRef } ) => html`
	<video
		ref=${mediaRef}
		data-id=${id}
		title=${alt}
		type=${mime}
		src=${url}
		class="wp-story-video intrinsic-ignore"
		playsinline
	></video>
`;

export const Media = props => html`
	<figure>
		${'image' === props.type
			? html`
					<${Image} ...${props} />
			  `
			: html`
					<${Video} ...${props} />
			  `}
	</figure>
`;
