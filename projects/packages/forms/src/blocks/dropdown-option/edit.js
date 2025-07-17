import { RichText, useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { Button, Flex, FlexItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down';

const noop = () => undefined;

export default function DropdownOptionEdit( props ) {
	// eslint-disable-next-line no-console
	console.log( props );
	const { attributes, clientId, setAttributes, name } = props;
	const { option } = attributes;
	const className = 'jetpack-field-dropdown__option';
	const blockProps = useBlockProps( { className } );
	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId, name );

	const { removeBlocks } = useDispatch( blockEditorStore ); // insertAfterBlock

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
						onRemove={ onRemove }
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
