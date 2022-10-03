/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from './utils/url';

/**
 * VideoPress block save function
 *
 * @param {object} props             - Component props.
 * @param {object} props.attributes  - Block attributes.
 * @returns {object}                 - React component.
 */
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
	} = attributes;

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

	// Adjust block with based on custom maxWidth.
	const style = {};
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
