import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import clsx from 'clsx';
import useFieldSelected from '../hooks/use-field-selected';
import useJetpackFieldStyles from '../hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS } from '../util/constants';
import JetpackFieldControls from './jetpack-field-controls';

const JetpackField = props => {
	const {
		attributes,
		clientId,
		id,
		isSelected,
		label,
		required,
		requiredText,
		setAttributes,
		type,
		width,
	} = props;
	const { isInnerBlockSelected, hasPlaceholder } = useFieldSelected( clientId );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': hasPlaceholder,
		} ),
		style: blockStyle,
	} );

	const labelBlockType = getBlockType( 'jetpack/label' );
	const defaultLabel = labelBlockType.attributes.label.default;
	const template = useMemo( () => {
		return [
			[ 'jetpack/label', { label, required, defaultLabel, requiredText } ],
			[ 'jetpack/input', { type } ],
		];
	}, [ label, defaultLabel, required, requiredText, type ] );
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
				width={ width }
				setAttributes={ setAttributes }
				attributes={ attributes }
				type={ type }
			/>
		</>
	);
};

export default JetpackField;

const withCustomClassName = createHigherOrderComponent( BlockListBlock => {
	return props => {
		if ( props.name.indexOf( 'jetpack/field' ) > -1 ) {
			const customClassName = props.attributes.width
				? 'jetpack-field__width-' + props.attributes.width
				: '';

			return <BlockListBlock { ...props } className={ customClassName } />;
		}

		return <BlockListBlock { ...props } />;
	};
}, 'withCustomClassName' );

addFilter( 'editor.BlockListBlock', 'jetpack/contact-form', withCustomClassName );
