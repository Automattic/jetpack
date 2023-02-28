/**
 * WordPress dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { ReactElement } from 'react';
/**
 * Internal dependencies
 */
import { isVideoPressBlockBasedOnAttributes } from '../../../utils';
import styles from './styles.module.scss';

/**
 * React component that renders a block conversion control
 *
 * @returns {ReactElement}          - Transform panel component.
 */
export default function TransformControl() {
	const postId = useSelect( select => select( editorStore ).getCurrentPostId() );

	const { getBlocks } = useSelect( blockEditorStore );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const { tracks } = useAnalytics();

	const handleTransformAll = () => {
		const blocks = getBlocks();

		blocks.forEach( block => {
			const { clientId, name, attributes } = block;
			if ( name === 'core/video' && isVideoPressBlockBasedOnAttributes( attributes ) ) {
				replaceBlock( clientId, createBlock( 'videopress/video', attributes ) );

				tracks.recordEvent( 'jetpack_editor_videopress_block_manual_conversion_click', {
					post_id: postId,
				} );
			}
		} );
	};

	return (
		<div className={ styles.wrapper }>
			<Notice status="info" isDismissible={ false } className={ styles[ 'conversion-notice' ] }>
				{ __(
					"You can transform this post's video blocks to the new VideoPress block to take advantage of new features, such as adding chapters directly in the description or hiding the video's share menu.",
					'jetpack'
				) }
			</Notice>
			<Button variant="primary" onClick={ handleTransformAll }>
				{ __( 'Transform blocks to VideoPress', 'jetpack' ) }
			</Button>
		</div>
	);
}
