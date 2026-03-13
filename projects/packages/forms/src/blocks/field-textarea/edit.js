import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls.js';
import useFieldSelected from '../shared/hooks/use-field-selected.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles.js';
import useSyncRequiredIndicator from '../shared/hooks/use-sync-required-indicator.js';
import { ALLOWED_INNER_BLOCKS } from '../shared/util/constants.js';

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

	useSyncRequiredIndicator( {
		clientId,
		blockName: 'jetpack/field-sync',
		isSynced: attributes?.shareFieldAttributes,
		attributes,
		setAttributes,
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
