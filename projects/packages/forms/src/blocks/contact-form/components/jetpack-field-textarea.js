import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';
import clsx from 'clsx';
import { isEmpty, isNil } from 'lodash';
import { ALLOWED_INNER_BLOCKS } from '../util/constants';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const JetpackFieldTextarea = props => {
	const {
		attributes,
		id,
		isSelected,
		label,
		placeholder,
		required,
		requiredText,
		setAttributes,
		width,
	} = props;

	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-field-textarea', {
			'is-selected': isSelected,
			'has-placeholder': ! isEmpty( placeholder ),
		} ),
		style: blockStyle,
	} );

	const labelBlockType = getBlockType( 'jetpack/field-label' );
	const defaultLabel = labelBlockType.attributes.label.default;
	const template = useMemo( () => {
		return [
			[ 'jetpack/field-label', { label, required, defaultLabel, requiredText } ],
			[ 'jetpack/field-input' ],
		];
	}, [ label, defaultLabel, required, requiredText ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_INNER_BLOCKS,
		template,
		templateLock: 'all',
		type: 'textarea',
	} );

	useEffect( () => {
		if ( isNil( label ) ) {
			setAttributes( { label: '' } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<>
			<div { ...innerBlocksProps } />
			<JetpackFieldControls
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
				placeholder={ placeholder }
				attributes={ attributes }
				type="textarea"
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] )
)( JetpackFieldTextarea );
