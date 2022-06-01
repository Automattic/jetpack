import { InnerBlocks } from '@wordpress/block-editor';
import classnames from 'classnames';

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
