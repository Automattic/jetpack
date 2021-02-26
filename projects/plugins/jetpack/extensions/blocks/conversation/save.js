/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<div
			className={ classnames( 'wp-block-jetpack-conversation', {
				'show-timestamps': attributes?.showTimestamp,
			} ) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
