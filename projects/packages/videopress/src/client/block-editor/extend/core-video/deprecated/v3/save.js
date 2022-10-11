import { RichText, useBlockProps } from '@wordpress/block-editor';
import classnames from 'classnames';
import { getVideoPressUrl } from './url';

/**
 * Deprecated save function for the VideoPress block.
 *
 * @param {object} props            - Block properties.
 * @param {object} props.attributes - Block attributes.
 * @returns {string} Block save representation.
 */
export default function VideoPressSave( props ) {
	const {
		attributes: {
			autoplay,
			caption,
			controls,
			guid,
			loop,
			muted,
			playsinline,
			poster,
			preload,
			videoPressClassNames,
			className,
			align,
			seekbarColor,
			seekbarPlayedColor,
			seekbarLoadingColor,
		} = {},
	} = props;

	const blockProps = useBlockProps.save( {
		className: classnames( 'wp-block-video', className, videoPressClassNames, {
			[ `align${ align }` ]: align,
		} ),
	} );

	const url = getVideoPressUrl( guid, {
		autoplay,
		controls,
		loop,
		muted,
		playsinline,
		poster,
		preload,
		seekbarColor,
		seekbarPlayedColor,
		seekbarLoadingColor,
	} );

	return (
		<figure { ...blockProps }>
			<div className="wp-block-embed__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
