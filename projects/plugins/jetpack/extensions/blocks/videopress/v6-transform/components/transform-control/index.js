/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, Notice } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
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
	const { getBlocks } = useSelect( blockEditorStore );
	const { replaceBlock } = useDispatch( blockEditorStore );

	const handleTransformAll = () => {
		const blocks = getBlocks();

		blocks.forEach( block => {
			const { clientId, name, attributes } = block;

			if ( name === 'core/video' && isVideoPressBlockBasedOnAttributes( attributes ) ) {
				replaceBlock( clientId, createBlock( 'videopress/video', attributes ) );
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
