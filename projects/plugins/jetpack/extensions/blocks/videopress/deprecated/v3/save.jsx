import { RichText, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import { getVideoPressUrl } from './url';

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
		className: clsx( 'wp-block-video', className, videoPressClassNames, {
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
