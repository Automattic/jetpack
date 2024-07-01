/**
 * WordPress dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { ReactElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { isVideoPressBlockBasedOnAttributes } from '../../../utils';
import styles from './styles.module.scss';

const videoPressVideoBlocks = { instances: [] };

// eslint-disable-next-line jsdoc/require-returns-check
/**
 * Recursively get all core/video VideoPress (aka v5) block instances
 *
 * @param {Array} blocks - Array of blocks
 * @param {boolean} root - Whether it is the root block
 * @param {number} level - Nesting level in the block tree
 * @returns {Array}        Array of VideoPress blocks
 */
const getAllCoreVideoVideoPressVideoBlocks = ( blocks = [], root = false, level = 0 ) => {
	if ( root ) {
		// Clear the instances when it's called from the root block.
		videoPressVideoBlocks.instances = [];
	}

	blocks.forEach( block => {
		if ( block.innerBlocks.length ) {
			// Recursively call increasing the nesting level.
			getAllCoreVideoVideoPressVideoBlocks( block.innerBlocks, false, level + 1 );
			return;
		}

		const { clientId, name, attributes } = block;
		if ( name === 'core/video' && isVideoPressBlockBasedOnAttributes( attributes ) ) {
			videoPressVideoBlocks.instances.push( { clientId, name, attributes } );
		}
	} );

	/*
	 * Level zero is the first call,
	 * but also is the last of the recursive calls.
	 * Return the collected block instances when it's the last one.
	 */
	if ( level === 0 ) {
		return videoPressVideoBlocks.instances;
	}
};

/**
 * React component that renders a block conversion control
 *
 * @param {object} props            - Component props
 * @param {string} props.clientId   - Block client ID
 * @param {object} props.attributes - Block attributes
 * @returns {ReactElement} Transform panel component.
 */
export default function TransformControl( {
	clientId: currentBlockClientId,
	attributes: currentBlockAttributes,
} ) {
	const postId = useSelect( select => select( editorStore ).getCurrentPostId() );

	const { getBlocks } = useSelect( blockEditorStore );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const { tracks } = useAnalytics();

	const handleTransformAll = () => {
		const allV5Instances = getAllCoreVideoVideoPressVideoBlocks( getBlocks(), true );
		if ( ! allV5Instances?.length ) {
			return;
		}

		// Ensure the current block is included in the list.
		if ( ! allV5Instances.find( block => block.clientId === currentBlockClientId ) ) {
			allV5Instances.push( {
				clientId: currentBlockClientId,
				name: 'core/video',
				currentBlockAttributes,
			} );
		}

		allV5Instances.forEach( block => {
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
