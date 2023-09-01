import { BlockIcon } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import icon from './icon';

function BlogrollItemEdit( { className, noticeUI } ) {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */

	return (
		<div className={ className }>
			<Placeholder
				label={ __( 'Blogroll Item', 'jetpack' ) }
				instructions={ __( 'Instructions go here.', 'jetpack' ) }
				icon={ <BlockIcon icon={ icon } /> }
				notices={ noticeUI }
			>
				{ __( 'User input goes here?', 'jetpack' ) }
			</Placeholder>
		</div>
	);
}

export default BlogrollItemEdit;
