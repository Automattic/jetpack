import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFieldSelected from '../shared/hooks/use-field-selected';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS } from '../shared/util/constants';

export default function TextareaFieldEdit( props ) {
	const { attributes, clientId, id, isSelected, label, requiredText, setAttributes } = props;
	const { required, width } = attributes;

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
