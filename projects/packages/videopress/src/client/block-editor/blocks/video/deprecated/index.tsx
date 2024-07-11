/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../../../../lib/url';
import { isVideoFramePosterEnabled } from '../components/poster-panel';
/**
 * Types
 */
import type { VideoBlockAttributes } from '../types';
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
function save( { attributes }: videoBlockSaveProps ): React.ReactNode {
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
		className: clsx( 'wp-block-jetpack-videopress', 'jetpack-videopress-player', {
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

const attributes = {
	autoplay: {
		type: 'boolean',
	},
	title: {
		type: 'string',
	},
	description: {
		type: 'string',
	},
	caption: {
		type: 'string',
		source: 'html',
		selector: 'figcaption',
	},
	controls: {
		type: 'boolean',
		default: true,
	},
	loop: {
		type: 'boolean',
	},
	maxWidth: {
		type: 'string',
		default: '100%',
	},
	muted: {
		type: 'boolean',
	},
	playsinline: {
		type: 'boolean',
	},
	preload: {
		type: 'string',
		default: 'metadata',
	},
	seekbarPlayedColor: {
		type: 'string',
		default: '',
	},
	seekbarLoadingColor: {
		type: 'string',
		default: '',
	},
	seekbarColor: {
		type: 'string',
		default: '',
	},
	useAverageColor: {
		type: 'boolean',
		default: true,
	},
	id: {
		type: 'number',
	},
	guid: {
		type: 'string',
	},
	src: {
		type: 'string',
	},
	cacheHtml: {
		type: 'string',
		default: '',
	},
	poster: {
		type: 'string',
	},
	posterData: {
		type: 'object',
		default: {},
	},
	videoRatio: {
		type: 'number',
	},
	tracks: {
		type: 'array',
		items: {
			type: 'object',
		},
		default: [],
	},
	privacySetting: {
		type: 'number',
		default: 1,
	},
	allowDownload: {
		type: 'boolean',
		default: true,
	},
	displayEmbed: {
		type: 'boolean',
		default: true,
	},
	rating: {
		type: 'string',
	},
	isPrivate: {
		type: 'boolean',
	},
	isExample: {
		type: 'boolean',
		default: false,
	},
	duration: {
		type: 'number',
	},
};

export default [
	{
		attributes,
		supports: {
			align: true,
			anchor: true,
		},
		save,
	},
];
