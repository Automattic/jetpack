import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import clsx from 'clsx';
import { isEmpty } from 'lodash';
import JetpackFieldControlsV2 from './jetpack-field-controls-v2';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const ALLOWED_BLOCKS = [ 'jetpack/field-label', 'jetpack/field-input' ];

const JetpackFieldV2 = props => {
	const {
		attributes,
		id,
		label,
		isSelected,
		required,
		requiredText,
		setAttributes,
		placeholder,
		width,
	} = props;

	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field', {
			'is-selected': isSelected,
			'has-placeholder': ! isEmpty( placeholder ),
		} ),
		style: blockStyle,
	} );

	const template = useMemo( () => {
		return [
			[ 'jetpack/field-label', { label, required, defaultLabel: label, requiredText } ],
			[ 'jetpack/field-input' ],
		];
	}, [ label, required, requiredText ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template,
		templateLock: 'all',
	} );

	return (
		<>
			<div { ...innerBlocksProps } />
			<JetpackFieldControlsV2
				id={ id }
				required={ required }
				width={ width }
				setAttributes={ setAttributes }
				placeholder={ placeholder }
				attributes={ attributes }
			/>
		</>
	);
};

export default JetpackFieldV2;

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
