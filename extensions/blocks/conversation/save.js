/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save ( { attributes } ) {
	const baseClassName = 'wp-block-jetpack-conversation';

	return (
		<div
			className={ classnames(
				baseClassName,
				'entry-content',
				{
					'show-timestamp': attributes?.showTimeStamp,
				}
			) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
