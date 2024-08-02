import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { first } from 'lodash';
import { useEffect } from 'react';
import { supportsParagraphSplitting } from '../util/block-support';
import { useParentAttributes } from '../util/use-parent-attributes';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

export const JetpackFieldOptionEdit = ( {
	isSelected,
	attributes,
	clientId,
	name,
	onReplace,
	setAttributes,
} ) => {
	const { removeBlock } = useDispatch( 'core/block-editor' );
	const parentAttributes = useParentAttributes( clientId );
	const { optionStyle } = useJetpackFieldStyles( parentAttributes );
	const siblingsCount = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );
			const parentBlockId = first( blockEditor.getBlockParents( clientId, true ) );
			return blockEditor.getBlock( parentBlockId ).innerBlocks.length;
		},
		[ clientId ]
	);
	const blockProps = useBlockProps();
	const labelRef = useRef( null );

	const handleSplit = label => {
		return createBlock( name, {
			...attributes,
			clientId: label && attributes.label.indexOf( label ) === 0 ? attributes.clientId : undefined,
			label,
		} );
	};

	const handleDelete = () => {
		if ( siblingsCount <= 1 ) {
			return;
		}

		removeBlock( clientId );
	};

	const onFocus = () => {
		// TODO: move cursor to end
	};

	useEffect( () => {
		const element = labelRef.current;

		element?.addEventListener( 'focus', onFocus );

		if ( isSelected ) {
			// Timeout is necessary for the focus to be effective
			setTimeout( () => element?.focus(), 0 );
		}

		return () => {
			element?.removeEventListener( 'focus', onFocus );
		};
	}, [ isSelected, labelRef ] );

	const supportsSplitting = supportsParagraphSplitting();
	const type = name.replace( 'jetpack/field-option-', '' );
	const classes = clsx( 'jetpack-field-option', `field-option-${ type }` );

	return (
		<div { ...( supportsSplitting ? blockProps : {} ) } className={ classes } style={ optionStyle }>
			<input type={ type } className="jetpack-option__type" tabIndex="-1" />
			<RichText
				identifier="label"
				tagName="p"
				className="wp-block"
				value={ attributes.label }
				placeholder={ __( 'Add option…', 'jetpack-forms' ) }
				allowedFormats={ [] }
				onChange={ val => setAttributes( { label: val } ) }
				onReplace={ onReplace }
				onRemove={ handleDelete }
				preserveWhiteSpace={ false }
				withoutInteractiveFormatting
				ref={ labelRef }
				{ ...( supportsSplitting ? {} : { onSplit: handleSplit } ) }
			/>
		</div>
	);
};
