import { RichText } from '@wordpress/block-editor';

/**
 * Deprecated save function for the VideoPress block.
 *
 * @param {object} props            - Block properties.
 * @param {object} props.attributes - Block attributes.
 * @returns {string} Block save representation.
 */
export default function VideoPressSave( { attributes } ) {
	const { caption, guid } = attributes;

	if ( ! guid ) {
		return null;
	}

	const url = `https://videopress.com/v/${ guid }`;

	return (
		<figure className="wp-block-embed is-type-video is-provider-videopress">
			<div className="wp-block-embed__wrapper">
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
