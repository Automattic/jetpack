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
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';

export default function ImageSelectFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes, name } = props;
	const { id, required, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected } = useSelect(
		select => {
			const { hasSelectedInnerBlock } = select( blockEditorStore );
			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);

	// This wraps the field in a form block if it is added directly to the editor.
	useFormWrapper( { attributes, clientId, name } );

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-image-select', {
			'is-selected': isSelected || isInnerBlockSelected,
		} ),
		style: blockStyle,
	} );

	const template = useMemo( () => {
		return [
			[
				'jetpack/label',
				{
					label: __( 'Choose one option', 'jetpack-forms' ),
					required,
				},
			],
			[ 'jetpack/form-image-select-choices' ],
		];
	}, [ required ] );

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-image-select__wrapper' },
		{
			allowedBlocks: [ 'jetpack/label', 'jetpack/form-image-select-choices' ],
			template,
			templateLock: 'all',
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
			<JetpackFieldControls
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</div>
	);
}
