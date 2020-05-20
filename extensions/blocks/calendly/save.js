/* eslint-disable wpcalypso/import-docblock, jsdoc/require-jsdoc */
/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes: { url } } ) {
	return (
		<div>
			<InnerBlocks.Content />
			<a className="wp-block-jetpack-calendly__fallback" href={ url }>
				{ url }
			</a>
		</div>
	);
}
