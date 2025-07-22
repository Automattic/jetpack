import { RichText, useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, Flex, FlexItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

export default function DropdownOptionEdit( props ) {
	const { attributes, clientId, mergeBlocks, setAttributes } = props;
	const { option } = attributes;
	const className = 'jetpack-field-dropdown__option';
	const blockProps = useBlockProps( {
		className,
	} );
	const { removeBlocks, replaceBlocks, insertBlocks } = useDispatch( blockEditorStore );
	const {
		getBlockIndex,
		getBlockRootClientId,
		getMultiSelectedBlockClientIds,
		getNextBlockClientId,
		getPreviousBlockClientId,
	} = useSelect( blockEditorStore );

	const onPaste = event => {
		const pastedText = event.clipboardData.getData( 'text/plain' );

		// While pasting, multiple blocks were selected
		const multiSelectedBlockClientIds = getMultiSelectedBlockClientIds();
		if ( multiSelectedBlockClientIds.length ) {
			const lines = pastedText.split( '\n' );
			const newOptions = lines.map( line =>
				createBlock( 'jetpack/dropdown-option', { option: line } )
			);
			replaceBlocks( multiSelectedBlockClientIds, newOptions );
			return;
		}

		// Otherwise pasting in a single block…

		// Check if the pasted text contains multiple lines
		if ( pastedText.includes( '\n' ) ) {
			event.preventDefault();

			const lines = pastedText.split( '\n' );

			// Grab first element of the pasted list as a value for current option block
			const firstLine = lines.shift();
			setAttributes( { option: `${ option || '' }${ firstLine }` } );

			// Append rest of the lines as new option blocks
			const newOptions = lines.map( line =>
				createBlock( 'jetpack/dropdown-option', { option: line } )
			);
			const rootClientId = getBlockRootClientId( clientId );
			const index = getBlockIndex( clientId );

			insertBlocks( newOptions, index + 1, rootClientId );
		}
	};

	const onRemove = () => {
		const nextBlockClientId = getNextBlockClientId( clientId );
		const previousBlockClientId = getPreviousBlockClientId( clientId );

		if ( ! nextBlockClientId || ! previousBlockClientId ) {
			// If this is the the only option, remove by emptying value
			setAttributes( { option: '' } );
			return;
		}

		return removeBlocks( clientId );
	};

	return (
		<div { ...blockProps }>
			<Flex>
				<FlexItem isBlock>
					<RichText
						__unstablePastePlainText
						allowedFormats={ [] }
						aria-label={ __( 'Dropdown option value', 'jetpack-forms' ) }
						identifier="option"
						onChange={ value => setAttributes( { option: value } ) }
						onMerge={ mergeBlocks }
						onPaste={ onPaste }
						onRemove={ onRemove }
						placeholder={ __( 'Add option…', 'jetpack-forms' ) }
						value={ option || '' }
						withoutInteractiveFormatting
					/>
				</FlexItem>
				<FlexItem>
					<Button
						className="jetpack-field-dropdown__option-remove"
						label={ __( 'Remove', 'jetpack-forms' ) }
						variant="tertiary"
						onClick={ onRemove }
						icon={ close }
					></Button>
				</FlexItem>
			</Flex>
		</div>
	);
}
