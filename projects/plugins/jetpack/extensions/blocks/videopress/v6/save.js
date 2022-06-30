/**
 * External dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../url';

export default function save( { attributes } ) {
	const {
		align,
		autoplay,
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

	return (
		<figure { ...blockProps }>
			<div className="jetpack-videopress__wrapper">
				{ `\n${ videoPressUrl }\n` /* URL needs to be on its own line. */ }
			</div>
		</figure>
	);
}
