import {
	useBlockProps,
	store as blockEditorStore,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import clsx from 'clsx';
import { isNumber } from 'lodash';
import useFieldSelected from '../hooks/use-field-selected';
import useJetpackFieldStyles from '../hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS, FORM_STYLE } from '../util/constants';
import getBlockStyle from '../util/get-block-style.js';
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
		context,
	} = props;
	const { isInnerBlockSelected, hasPlaceholder } = useFieldSelected( clientId );
	const { blockStyle } = useJetpackFieldStyles( attributes );
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
				: null,
			'--jetpack--contact-form--border-color': inputBorderStyles?.color,
			'--jetpack--contact-form--border-radius': inputBorderStyles?.radius,
			'--jetpack--contact-form--border-style': inputBorderStyles?.style,
		};
	}

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': hasPlaceholder,
		} ),
		style: {
			...blockStyle,
			...outlinedBorderStyles,
		},
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
