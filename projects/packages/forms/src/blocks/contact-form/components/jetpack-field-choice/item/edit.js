import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock, cloneBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { supportsParagraphSplitting } from '../../../util/block-support';
import { useParentAttributes } from '../../../util/use-parent-attributes';
import { useJetpackFieldStyles } from '../../use-jetpack-field-styles';

function useEnter( props ) {
	const { replaceBlocks, selectionChange } = useDispatch( blockEditorStore );
	const { getBlock, getBlockRootClientId, getBlockIndex } = useSelect( blockEditorStore );
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( element => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented || event.key !== 'Enter' ) {
				return;
			}
			const { content, clientId } = propsRef.current;
			if ( content?.length ) {
				return;
			}
			event.preventDefault();
			const topParentBlock = getBlock( getBlockRootClientId( clientId ) );
			const blockIndex = getBlockIndex( clientId );
			const head = cloneBlock( {
				...topParentBlock,
				innerBlocks: topParentBlock.innerBlocks.slice( 0, blockIndex ),
			} );
			const middle = createBlock( getDefaultBlockName() );
			const after = topParentBlock.innerBlocks.slice( blockIndex + 1 );
			const tail = after.length
				? [
						cloneBlock( {
							...topParentBlock,
							innerBlocks: after,
						} ),
				  ]
				: [];
			replaceBlocks( topParentBlock.clientId, [ head, middle, ...tail ], 1 );
			// We manually change the selection here because we are replacing
			// a different block than the selected one.
			selectionChange( middle.clientId );
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => {
			element.removeEventListener( 'keydown', onKeyDown );
		};
	}, [] );
}

export default function JetpackFieldChoiceItemEdit( {
	attributes,
	clientId,
	name,
	onReplace,
	setAttributes,
	type,
} ) {
	const { removeBlock } = useDispatch( blockEditorStore );
	const parentAttributes = useParentAttributes( clientId );
	const { optionStyle } = useJetpackFieldStyles( parentAttributes );
	const siblingsCount = useSelect(
		select => {
			const { getBlockCount, getBlockRootClientId } = select( blockEditorStore );
			return getBlockCount( getBlockRootClientId( clientId ) );
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
	const useEnterRef = useEnter( { content: attributes.label, clientId } );
	return (
		<>
			<li { ...innerBlocksProps }>
				<input type={ type } className="jetpack-option__type" tabIndex="-1" />
				<RichText
					ref={ useEnterRef }
					identifier="label"
					tagName="div"
					className="wp-block"
					value={ attributes.label }
					placeholder={ __( 'Add option…', 'jetpack-forms' ) }
					__unstableDisableFormats
					onChange={ newLabel => setAttributes( { label: newLabel } ) }
					preserveWhiteSpace={ false }
					onRemove={ handleDelete }
					onReplace={ onReplace }
					{ ...( supportsSplitting ? {} : { onSplit: handleSplit } ) }
				/>
			</li>
		</>
	);
}
