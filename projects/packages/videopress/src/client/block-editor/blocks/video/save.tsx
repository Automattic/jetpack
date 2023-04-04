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

	const { previewOnHover, previewAtTime, previewLoopDuration } = posterData ?? {};

	const blockProps = useBlockProps.save( {
		className: classnames( 'wp-block-jetpack-videopress', 'jetpack-videopress-player', {
			[ `align${ align }` ]: align,
		} ),
	} );

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay,
		controls,
		loop,
		muted,
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

	return (
		<figure { ...blockProps } style={ style }>
			{ videoPressUrl && (
				<>
					{ previewOnHover && (
						<span
							style={ { display: 'none', visibility: 'hidden', position: 'absolute' } }
							className="videopress-poh"
						>
							<span className="videopress-poh__sp">{ previewAtTime }</span>
							<span className="videopress-poh__duration">{ previewLoopDuration }</span>
						</span>
					) }
					<div className="jetpack-videopress-player__wrapper">
						{ `\n${ videoPressUrl }\n` /* URL needs to be on its own line. */ }
					</div>
				</>
			) }

			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
