/* eslint-disable wpcalypso/import-docblock, jsdoc/require-jsdoc */
/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { eventId, style, url } = attributes;

	if ( ! eventId ) {
		return;
	}

	if ( style === 'modal' ) {
		return (
			<div>
				<InnerBlocks.Content />
			</div>
		);
	}

	return (
		url && (
			<a className="eventbrite__direct-link" href={ url }>
				{ url }
			</a>
		)
	);
}
