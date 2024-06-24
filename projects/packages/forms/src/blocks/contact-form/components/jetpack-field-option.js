import { RichText } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { first } from 'lodash';
import { useParentAttributes } from '../util/use-parent-attributes';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

export const JetpackFieldOptionEdit = props => {
	const { attributes, clientId, name, onReplace, setAttributes } = props;
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

	const type = name.replace( 'jetpack/field-option-', '' );

	const classes = clsx( 'jetpack-field-option', `field-option-${ type }` );

	const handleSplit = label =>
		createBlock( name, {
			...attributes,
			clientId: label && attributes.label.indexOf( label ) === 0 ? attributes.clientId : undefined,
			label,
		} );

	const handleDelete = () => {
		if ( siblingsCount <= 1 ) {
			return;
		}

		removeBlock( clientId );
	};

	return (
		<div className={ classes } style={ optionStyle }>
			<input type={ type } className="jetpack-option__type" tabIndex="-1" />
			<RichText
				allowedFormats={ [] }
				onChange={ value => {
					setAttributes( { label: value } );
				} }
				onRemove={ handleDelete }
				onSplit={ handleSplit }
				onReplace={ onReplace }
				placeholder={ __( 'Add option…', 'jetpack-forms' ) }
				preserveWhiteSpace={ false }
				withoutInteractiveFormatting
				value={ attributes.label }
			/>
		</div>
	);
};
