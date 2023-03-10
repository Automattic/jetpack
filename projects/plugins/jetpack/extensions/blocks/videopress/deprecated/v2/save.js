import { RichText } from '@wordpress/block-editor';
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
			poster,
			preload,
			videoPressClassNames,
		} = {},
	} = props;

	if ( ! guid ) {
		return null;
	}

	const url = getVideoPressUrl( guid, {
		autoplay,
		controls,
		loop,
		muted,
		poster,
		preload,
	} );

	return (
		<figure className={ videoPressClassNames }>
			<div className="wp-block-embed__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
