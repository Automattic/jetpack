/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */

export const Image = ( { title, alt, className, id, mediaRef, mime, sizes, srcset, url } ) => (
	// eslint-disable-next-line jsx-a11y/media-has-caption
	<img
		ref={ mediaRef }
		data-id={ id }
		data-mime={ mime }
		title={ title }
		alt={ alt }
		src={ url }
		className={ classNames( 'wp-story-image', `wp-image-${ id }`, className ) }
		srcSet={ srcset }
		sizes={ sizes }
	/>
);

export const Video = ( { title, className, id, mediaRef, mime, url } ) => (
	// eslint-disable-next-line jsx-a11y/media-has-caption
	<video
		className={ classNames( 'wp-story-video', 'intrinsic-ignore', `wp-video-${ id }`, className ) }
		ref={ mediaRef }
		data-id={ id }
		title={ title }
		type={ mime }
		src={ url }
		playsInline
	></video>
);

export const Media = ( { targetAspectRatio, cropUpTo, type, width, height, ...props } ) => {
	let className = null;
	if ( width && height ) {
		const mediaAspectRatio = width / height;
		if ( mediaAspectRatio >= targetAspectRatio ) {
			// image wider than canvas
			const mediaTooWideToCrop = mediaAspectRatio > targetAspectRatio / ( 1 - cropUpTo );
			if ( ! mediaTooWideToCrop ) {
				className = 'wp-story-crop-wide';
			}
		} else {
			// image narrower than canvas
			const mediaTooNarrowToCrop = mediaAspectRatio < targetAspectRatio * ( 1 - cropUpTo );
			if ( ! mediaTooNarrowToCrop ) {
				className = 'wp-story-crop-narrow';
			}
		}
	}
	const isVideo = 'video' === type || ( props.mime || '' ).startsWith( 'video/' );
	return (
		<figure>
			{ isVideo ? (
				<Video { ...props } className={ className } />
			) : (
				<Image { ...props } className={ className } />
			) }
		</figure>
	);
};
