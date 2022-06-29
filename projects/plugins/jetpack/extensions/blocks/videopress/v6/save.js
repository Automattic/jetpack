/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
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
	} = attributes;

	const blockProps = useBlockProps.save( {
		className: classnames( 'jetpack-videopress', {
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
	} );

	// Adjust block with based on custom maxWidth.
	const style = {};
	if ( maxWidth && maxWidth.length > 0 && '100%' !== maxWidth ) {
		style.maxWidth = maxWidth;
		style.margin = 'auto';
	}

	return (
		<figure { ...blockProps } style={ style }>
			<div className="jetpack-videopress__wrapper">
				{ `\n${ videoPressUrl }\n` /* URL needs to be on its own line. */ }
			</div>

			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
