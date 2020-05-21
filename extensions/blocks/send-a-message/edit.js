/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function SendAMessageEdit( props ) {
	const { className } = props;

	const ALLOWED_BLOCKS = [ 'jetpack/whatsapp-button' ];

	return (
		<div className={ className }>
			<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } templateInsertUpdatesSelection={ false } />
		</div>
	);
}
