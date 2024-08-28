import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { first } from 'lodash';
import { supportsParagraphSplitting } from '../util/block-support';
import { moveCaretToEnd } from '../util/caret';
import { useParentAttributes } from '../util/use-parent-attributes';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

export const JetpackFieldOptionEdit = ( {
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

	const handleFocus = e => moveCaretToEnd( e.target );

	const supportsSplitting = supportsParagraphSplitting();
	const type = name.replace( 'jetpack/field-option-', '' );
	const classes = clsx( 'jetpack-field-option', `field-option-${ type }` );

	useEffect( () => {
		const input = document.getElementById( blockProps.id );

		input?.addEventListener( 'focus', handleFocus );

		return () => {
			input?.removeEventListener( 'focus', handleFocus );
		};
	}, [ blockProps.id ] );

	return (
		<div className={ classes } style={ optionStyle }>
			<input type={ type } className="jetpack-option__type" tabIndex="-1" />
			<RichText
				{ ...blockProps }
				identifier="label"
				tagName="div"
				className="wp-block"
				value={ attributes.label }
				placeholder={ __( 'Add option…', 'jetpack-forms' ) }
				allowedFormats={ [] }
				onChange={ val => setAttributes( { label: val } ) }
				onRemove={ handleDelete }
				onReplace={ onReplace }
				preserveWhiteSpace={ false }
				withoutInteractiveFormatting
				{ ...( supportsSplitting ? {} : { onSplit: handleSplit } ) }
			/>
		</div>
	);
};
