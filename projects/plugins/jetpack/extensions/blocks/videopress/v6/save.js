/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../url';

export default function save( { attributes } ) {
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
		autoplayHovering,
		autoplayHoveringStart,
		videoRatio,
	} = attributes;

	const blockProps = useBlockProps.save( {
		className: classnames( 'wp-block-jetpack-videopress', 'jetpack-videopress-player', {
			[ `align${ align }` ]: align,
		} ),
	} );

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay: autoplayHovering ? false : autoplay, // disable autoplay when hovering
		controls,
		loop,
		muted: muted || autoplayHovering,
		playsinline,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
		useAverageColor,
		poster,
	} );

	const preview = select( coreStore ).getEmbedPreview( videoPressUrl ) || false;

	const features = {
		autoplayHovering,
		autoplayHoveringStart,
		guid,
	};

	const html = preview ? preview.html : null;

	// Adjust block with based on custom maxWidth.
	const style = {
		width: '100%',
		overflow: 'hidden',
		border: 0,
		margin: 0,
	};

	const w = parseInt( maxWidth.replace( /[a-z|A-Z]./, '' ) );
	if ( maxWidth && maxWidth.length > 0 && '100%' !== maxWidth ) {
		style.maxWidth = maxWidth;
		style.margin = 'auto';
	}

	return (
		<figure
			{ ...blockProps }
			style={ style }
			data-features={ JSON.stringify( features ) }
			data-html={ JSON.stringify( html ) }
		>
			<iframe
				className="videoplayer-sandbox"
				sandbox="allow-scripts allow-same-origin allow-presentation"
				title={ caption }
				width={ style.width }
				height={ ( w * videoRatio ) / 100 }
				frameBorder="0"
				allowFullScreen
			/>

			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
