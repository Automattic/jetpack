import { RichText, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { first } from 'lodash';
import { supportsParagraphSplitting } from '../../../util/block-support';
import { useParentAttributes } from '../../../util/use-parent-attributes';
import { useJetpackFieldStyles } from '../../use-jetpack-field-styles';

export default function JetpackFieldChoiceItemEdit( {
	attributes,
	clientId,
	name,
	onReplace,
	setAttributes,
	type,
} ) {
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

	const supportsSplitting = supportsParagraphSplitting();
	const classes = clsx( 'jetpack-field-option', `field-option-${ type }`, blockProps.className );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		className: classes,
		style: optionStyle,
	} );

	return (
		<>
			<li { ...innerBlocksProps }>
				<input type={ type } className="jetpack-option__type" tabIndex="-1" />
				<RichText
					identifier="label"
					tagName="div"
					className="wp-block"
					value={ attributes.label }
					placeholder={ __( 'Add option…', 'jetpack-forms' ) }
					allowedFormats={ [] }
					onChange={ newLabel => setAttributes( { label: newLabel } ) }
					preserveWhiteSpace={ false }
					withoutInteractiveFormatting
					onRemove={ handleDelete }
					onReplace={ onReplace }
					{ ...( supportsSplitting ? {} : { onSplit: handleSplit } ) }
				/>
			</li>
		</>
	);
}
