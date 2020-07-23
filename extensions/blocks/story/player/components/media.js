/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */

export const Image = ( { alt, url, id, mime, mediaRef } ) => (
	// eslint-disable-next-line jsx-a11y/media-has-caption
	<img
		ref={ mediaRef }
		data-id={ id }
		data-mime={ mime }
		alt={ alt }
		src={ url }
		className={ `wp-story-image wp-image-${ id }` }
	/>
);

export const Video = ( { alt, mime, url, id, mediaRef } ) => (
	// eslint-disable-next-line jsx-a11y/media-has-caption
	<video
		ref={ mediaRef }
		data-id={ id }
		title={ alt }
		type={ mime }
		src={ url }
		className="wp-story-video intrinsic-ignore"
		playsInline
	></video>
);

export const Media = props => (
	<figure>{ 'image' === props.type ? <Image { ...props } /> : <Video { ...props } /> }</figure>
);
