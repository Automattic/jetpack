/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import classnames from 'classnames';
/**
 * Internal dependencies
 */

export default function save( { attributes } ) {
	const {
		autoplay,
		align,
		caption,
		maxWidth,
		hoverEffect,
		hoverEffectPlaybackAt,
		autoplayPlaybackAt,
		videoRatio,
		cacheHtml,
	} = attributes;

	const blockProps = useBlockProps.save( {
		className: classnames( 'wp-block-jetpack-videopress', 'jetpack-videopress-player', {
			[ `align${ align }` ]: align,
		} ),
	} );

	const features = {
		autoplay,
		autoplayPlaybackAt,
		hoverEffect,
		hoverEffectPlaybackAt,
		videoRatio,
	};

	// Adjust block with based on custom maxWidth.
	const style = {
		width: '100%',
		height: 'auto',
		overflow: 'hidden',
		border: 0,
		margin: 0,
	};

	const hasCustomSize = maxWidth && maxWidth.length > 0 && '100%' !== maxWidth;
	if ( hasCustomSize ) {
		style.maxWidth = maxWidth;
		style.margin = 'auto';
	}

	return (
		<figure
			{ ...blockProps }
			style={ style }
			data-features={ JSON.stringify( features ) }
			data-html={ JSON.stringify( cacheHtml ) }
		>
			<iframe
				className="videoplayer-sandbox"
				sandbox="allow-scripts allow-same-origin allow-presentation"
				title={ caption }
				width={ style.width }
				height={ style.height }
				frameBorder="0"
				allowFullScreen
			/>

			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
