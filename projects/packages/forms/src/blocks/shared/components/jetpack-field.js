import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useEffect } from '@wordpress/element';
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
		requiredIndicator,
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

	const template = useMemo( () => {
		return [
			[ 'jetpack/label', { label, required, requiredText, requiredIndicator } ],
			[ 'jetpack/input', { type } ],
		];
	}, [ label, required, requiredText, requiredIndicator, type ] );

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
