import { useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import useSyncStyleAttributes from '../../util/use-sync-style-attributes.js';

const SYNCED_ATTRIBUTES = [
	'backgroundColor',
	'borderColor',
	'fontFamily',
	'fontSize',
	'style',
	'textColor',
];

const JetpackInputEdit = ( { attributes, clientId, name, setAttributes } ) => {
	useSyncStyleAttributes( clientId, name, 'jetpack/contact-form', SYNCED_ATTRIBUTES );
	const className =
		attributes.type === 'textarea' ? 'jetpack-field__textarea' : 'jetpack-field__input';
	const blockProps = useBlockProps( { className } );

	// TODO: If field blocks can be nested within other blocks within a form,
	// the logic here will need improving so that the new block is inserted correctly.
	const { fieldParentId, parentIndex, formParentId } = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );
			const parentClientIds = blockEditor.getBlockParents( clientId );
			const parentId = parentClientIds[ parentClientIds.length - 1 ];

			return {
				fieldParentId: parentId,
				parentIndex: parentId ? blockEditor.getBlockIndex( parentId ) : undefined,
				formParentId: parentClientIds[ parentClientIds.length - 2 ],
			};
		},
		[ clientId ]
	);
	const { insertBlock } = useDispatch( 'core/block-editor' );

	const onKeyDown = useCallback(
		event => {
			if (
				event.key === 'Enter' &&
				! event.shiftKey &&
				fieldParentId &&
				parentIndex !== undefined
			) {
				event.preventDefault();
				insertBlock(
					createBlock( getDefaultBlockName() ),
					parentIndex + 1,
					formParentId // Insert in the same context as the field block
				);
			}
		},
		[ insertBlock, fieldParentId, formParentId, parentIndex ]
	);

	const onChange = useCallback(
		event => {
			setAttributes( { placeholder: event.target.value } );
		},
		[ setAttributes ]
	);

	if ( attributes.type === 'textarea' ) {
		return (
			<textarea
				{ ...blockProps }
				onChange={ onChange }
				style={ blockProps.style }
				value={ attributes.placeholder }
			/>
		);
	}

	return (
		<input
			{ ...blockProps }
			onChange={ onChange }
			onKeyDown={ onKeyDown }
			style={ blockProps.style }
			type="text"
			value={ attributes.placeholder }
		/>
	);
};

export default JetpackInputEdit;
