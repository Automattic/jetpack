/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../../../lib/url';
/**
 * Types
 */
import { isVideoFramePosterEnabled } from './components/poster-panel';
import type { VideoBlockAttributes } from './types';
import type React from 'react';

type videoBlockSaveProps = {
	attributes: VideoBlockAttributes;
};

/**
 * VideoPress block save function
 *
 * @param {object} props             - Component props.
 * @param {object} props.attributes  - Block attributes.
 * @returns {object}                 - React component.
 */
export default function save( { attributes }: videoBlockSaveProps ): React.ReactNode {
	const {
		align,
		autoplay,
		caption,
		loop,
		muted,
		controls,
		playsinline,
		preload,
		useAverageColor,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
		guid,
		maxWidth,
		poster,
		posterData,
	} = attributes;

	const blockProps = useBlockProps.save( {
		className: classnames( 'wp-block-jetpack-videopress', 'jetpack-videopress-player', {
			[ `align${ align }` ]: align,
		} ),
	} );

	const isPreviewOnHoverEnabled = isVideoFramePosterEnabled();

	const autoplayArg = ! isPreviewOnHoverEnabled ? autoplay : autoplay || posterData.previewOnHover;
	const mutedArg = ! isPreviewOnHoverEnabled ? muted : muted || posterData.previewOnHover;

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay: autoplayArg,
		controls,
		loop,
		muted: mutedArg,
		playsinline,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
		useAverageColor,
		poster,
	} );

	// Adjust block width based on custom maxWidth.
	const style: { maxWidth?: string; margin?: string } = {};
	if ( maxWidth && maxWidth.length > 0 && '100%' !== maxWidth ) {
		style.maxWidth = maxWidth;
		style.margin = 'auto';
	}

	if ( ! isVideoFramePosterEnabled() ) {
		return (
			<figure { ...blockProps } style={ style }>
				{ videoPressUrl && (
					<div className="jetpack-videopress-player__wrapper">
						{ `\n${ videoPressUrl }\n` /* URL needs to be on its own line. */ }
					</div>
				) }

				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	}

	return (
		<figure { ...blockProps } style={ style }>
			{ videoPressUrl && (
				<div className="jetpack-videopress-player__wrapper">
					{ `\n${ videoPressUrl }\n` /* URL needs to be on its own line. */ }
				</div>
			) }

			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
