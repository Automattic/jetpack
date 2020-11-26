/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save ( { attributes } ) {
	const baseClassName = 'wp-block-jetpack-transcription';

	return (
		<div
			className={ classnames(
				baseClassName,
				attributes?.dialogueStyle,
				{
					'show-timestamp': attributes?.showTimeStamp,
				}
			) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
