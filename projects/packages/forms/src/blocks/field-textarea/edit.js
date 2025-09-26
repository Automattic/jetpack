import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFieldSelected from '../shared/hooks/use-field-selected';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS } from '../shared/util/constants';

export default function TextareaFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes } = props;
	const { id, required, width, requiredIndicator } = attributes;

	useFormWrapper( props );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected, hasPlaceholder } = useFieldSelected( clientId );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-textarea', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': hasPlaceholder,
		} ),
		style: blockStyle,
	} );

	const template = useMemo( () => {
		return [
			[ 'jetpack/label', { label: __( 'Message', 'jetpack-forms' ), requiredIndicator } ],
			[ 'jetpack/input', { type: 'textarea' } ],
		];
	}, [ requiredIndicator ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_INNER_BLOCKS,
		template,
		templateLock: 'all',
	} );

	// Keep the inner label block's requiredIndicator in sync when it changes
	const labelClientId = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore );
			const parentBlock = getBlock( clientId );
			if ( ! parentBlock ) {
				return undefined;
			}
			const labelBlock = parentBlock.innerBlocks.find( block => block.name === 'jetpack/label' );
			return labelBlock?.clientId;
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( labelClientId ) {
			updateBlockAttributes( labelClientId, { requiredIndicator } );
		}
	}, [ labelClientId, requiredIndicator, updateBlockAttributes ] );

	return (
		<>
			<div { ...innerBlocksProps } />
			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
				attributes={ attributes }
				type="textarea"
			/>
		</>
	);
}
