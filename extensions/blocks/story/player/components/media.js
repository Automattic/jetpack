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

export const Image = ( { alt, url, id, mime, mediaRef, srcset, sizes, style } ) => (
	// eslint-disable-next-line jsx-a11y/media-has-caption
	<img
		ref={ mediaRef }
		data-id={ id }
		data-mime={ mime }
		alt={ alt }
		src={ url }
		className={ `wp-story-image wp-image-${ id }` }
		srcSet={ srcset }
		sizes={ sizes }
		style={ style }
	/>
);

export const Video = ( { alt, mime, url, id, mediaRef, style } ) => (
	// eslint-disable-next-line jsx-a11y/media-has-caption
	<video
		className="wp-story-video intrinsic-ignore"
		ref={ mediaRef }
		data-id={ id }
		title={ alt }
		type={ mime }
		src={ url }
		style={ style }
		playsInline
	></video>
);

export const Media = ( { targetAspectRatio, cropUpTo, type, width, height, ...props } ) => {
	const cropStyles = {};
	if ( width && height ) {
		const mediaAspectRatio = width / height;
		if ( mediaAspectRatio >= targetAspectRatio ) {
			// image wider than canvas
			const mediaTooWideToCrop = mediaAspectRatio > targetAspectRatio / ( 1 - cropUpTo );
			if ( ! mediaTooWideToCrop ) {
				cropStyles.maxWidth = 'revert';
			}
		} else {
			// image narrower than canvas
			const mediaTooNarrowToCrop = mediaAspectRatio < targetAspectRatio * ( 1 - cropUpTo );
			if ( ! mediaTooNarrowToCrop ) {
				cropStyles.maxHeight = 'revert';
			}
		}
	}
	const isVideo = 'video' === type || ( props.mime || '' ).startsWith( 'video/' );
	return (
		<figure>
			{ isVideo ? (
				<Video { ...props } style={ cropStyles } />
			) : (
				<Image { ...props } style={ cropStyles } />
			) }
		</figure>
	);
};
