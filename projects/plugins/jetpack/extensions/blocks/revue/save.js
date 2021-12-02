/* eslint-disable wpcalypso/import-docblock, jsdoc/require-jsdoc */
/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes: { revueUsername } } ) {
	const url = `https://www.getrevue.co/profile/${ revueUsername }`;
	return (
		<div>
			<InnerBlocks.Content />
			<a className="wp-block-jetpack-revue__fallback" href={ url }>
				{ url }
			</a>
		</div>
	);
}
