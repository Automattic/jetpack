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

const getInputClass = type => {
	if ( type ) {
		return `jetpack-field__${ type }`;
	}
	return 'jetpack-field__input';
};

const JetpackInputEdit = ( { attributes, clientId, context, name, setAttributes } ) => {
	useSyncStyleAttributes( clientId, name, 'jetpack/contact-form', SYNCED_ATTRIBUTES );
	// TODO: Do we really need an inline attribtue or can we just infer that via `type`?
	const { inline, placeholder, type } = attributes;
	const { 'jetpack/field-defaultValue': defaultValue } = context;
	const className = getInputClass( type );
	// TODO: Avoid inline style for flex-basis: auto.
	const blockProps = useBlockProps( {
		className,
		style: {
			flexBasis: inline ? 'auto' : undefined,
		},
	} );

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

	if ( type === 'checkbox' ) {
		return (
			<input
				{ ...blockProps }
				checked={ !! defaultValue }
				disabled
				style={ blockProps.style }
				type={ type }
			/>
		);
	}

	if ( type === 'textarea' ) {
		return (
			<textarea
				{ ...blockProps }
				onChange={ onChange }
				style={ blockProps.style }
				value={ placeholder }
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
			value={ placeholder }
		/>
	);
};

export default JetpackInputEdit;
