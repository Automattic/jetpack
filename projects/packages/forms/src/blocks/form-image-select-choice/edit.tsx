/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';

export default function ImageChoiceFieldEdit( props ) {
	const { attributes, clientId, isSelected } = props;
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected, imageBlockAttributes } = useSelect(
		select => {
			const { getBlock, hasSelectedInnerBlock } = select( blockEditorStore );
			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				imageBlockAttributes: getBlock( clientId ).innerBlocks[ 1 ]?.attributes,
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-form-image-select-choice', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-image': !! imageBlockAttributes?.url,
		} ),
		style: blockStyle,
	} );

	const template = useMemo( () => {
		return [
			[
				'jetpack/label',
				{
					label: sprintf(
						// translators: %d is the number of the image choice field.
						__( 'Image choice %d', 'jetpack-forms' ),
						1
					),
				},
			],
			[ 'core/image' ],
		];
	}, [] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-image-choice__wrapper' },
		{
			allowedBlocks: [ 'jetpack/label', 'core/image' ],
			template,
			templateLock: 'all', // The choice must have exactly one label and one image.
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
		</div>
	);
}
