import { RichText, useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { Button, Flex, FlexItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';

const noop = () => undefined;

export default function DropdownOptionEdit( props ) {
	const { attributes, clientId, setAttributes } = props;
	const { option } = attributes;
	const className = 'jetpack-field-dropdown__option';
	const blockProps = useBlockProps( { className } );

	const { removeBlocks, insertAfterBlock } = useDispatch( blockEditorStore );

	const onKeyDown = useCallback(
		event => {
			if ( event.key === 'Enter' && ! event.shiftKey ) {
				event.preventDefault();
				insertAfterBlock( clientId );
			}
		},
		[ insertAfterBlock, clientId ]
	);

	const onRemove = () => {
		return removeBlocks( clientId );
	};

	return (
		<div { ...blockProps }>
			<Flex>
				<FlexItem isBlock>
					<RichText
						allowedFormats={ [] }
						onChange={ value => setAttributes( { option: value } ) }
						onKeyDown={ onKeyDown }
						onReplace={ noop }
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
