import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { isNumber } from 'lodash';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFieldSelected from '../shared/hooks/use-field-selected';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS, FORM_STYLE } from '../shared/util/constants';
import getBlockStyle from '../shared/util/get-block-style.js';

export default function TextareaFieldEdit( props ) {
	const { attributes, clientId, id, isSelected, label, requiredText, setAttributes, context } =
		props;
	const { required, width } = attributes;

	useFormWrapper( props );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected, hasPlaceholder } = useFieldSelected( clientId );
	const firstInputBlock = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore );

			// Get the current (parent) block
			const parentBlock = getBlock( clientId );
			if ( ! parentBlock ) return null;

			// Find first input block within the innerBlocks
			return parentBlock.innerBlocks.find( block => block.name === 'jetpack/input' );
		},
		[ clientId ]
	);

	// Access the input block's attributes
	const inputBorderStyles = firstInputBlock?.attributes?.style?.border;
	const isOutlined = getBlockStyle( context?.[ 'jetpack/form-className' ] ) === FORM_STYLE.OUTLINED;
	let outlinedBorderStyles = {};
	if ( isOutlined && !! inputBorderStyles ) {
		outlinedBorderStyles = {
			'--jetpack--contact-form--border-size': isNumber( inputBorderStyles?.width )
				? `${ inputBorderStyles?.width }px`
				: inputBorderStyles?.width,
			'--jetpack--contact-form--border-color': inputBorderStyles?.color,
			'--jetpack--contact-form--border-radius': inputBorderStyles?.radius,
			'--jetpack--contact-form--border-style': inputBorderStyles?.style,
		};
	}
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-textarea', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': hasPlaceholder,
		} ),
		style: {
			...blockStyle,
			...outlinedBorderStyles,
		},
	} );

	const defaultLabel = __( 'Message', 'jetpack-forms' );

	const templateLabel = label ?? '';
	const template = useMemo( () => {
		return [
			[ 'jetpack/label', { label: templateLabel, defaultLabel, requiredText } ],
			[ 'jetpack/input', { type: 'textarea' } ],
		];
	}, [ templateLabel, defaultLabel, requiredText ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_INNER_BLOCKS,
		template,
		templateLock: 'all',
	} );

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
