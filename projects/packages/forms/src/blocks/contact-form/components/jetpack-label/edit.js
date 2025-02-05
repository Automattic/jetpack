import { useBlockProps } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { DATE_FORMATS } from '../../util/constants.js';
import useSyncStyleAttributes from '../../util/use-sync-style-attributes.js';
import JetpackFieldLabel from '../jetpack-field-label.js';

const SYNCED_ATTRIBUTES = [ 'textColor', 'fontFamily', 'fontSize', 'style' ];

const JetpackLabelEdit = ( { attributes, clientId, name, setAttributes, context } ) => {
	useSyncStyleAttributes( clientId, name, 'jetpack/contact-form', SYNCED_ATTRIBUTES );
	const { 'jetpack/field-required': required, 'jetpack/field-dateFormat': dateFormat } = context;
	const suffix = dateFormat
		? `(${ DATE_FORMATS.find( f => f.value === dateFormat )?.label })`
		: undefined;
	const blockProps = useBlockProps( {
		style: {
			flexBasis: attributes.inline ? 'auto' : undefined,
		},
	} );

	// TODO: If field blocks can be nested within other blocks within a form,
	// the logic here will need improving so that the new block is inserted correctly.
	// TODO: Refactor all this to follow `useEnter` hook and ref approach if possible.
	// Either way it needs fixing.
	const { parentIndex, formParentId } = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );
			const parentClientIds = blockEditor.getBlockParents( clientId );
			const parentId = parentClientIds[ parentClientIds.length - 1 ];

			return {
				parentIndex: parentId ? blockEditor.getBlockIndex( parentId ) : undefined,
				formParentId: parentClientIds[ parentClientIds.length - 2 ],
			};
		},
		[ clientId ]
	);
	const { insertBlock } = useDispatch( 'core/block-editor' );
	const insertAfterLabel = useCallback(
		blocks => {
			insertBlock(
				blocks,
				parentIndex + 1,
				formParentId // Insert in the same context as the field block
			);
		},
		[ parentIndex, formParentId, insertBlock ]
	);

	return (
		<JetpackFieldLabel
			blockProps={ blockProps }
			attributes={ attributes }
			insertBlocksAfter={ attributes.inline ? insertAfterLabel : undefined }
			label={ attributes.label }
			placeholder={ attributes.defaultLabel ?? attributes.label }
			required={ required }
			requiredText={ attributes.requiredText }
			setAttributes={ setAttributes }
			suffix={ suffix }
		/>
	);
};

export default JetpackLabelEdit;
