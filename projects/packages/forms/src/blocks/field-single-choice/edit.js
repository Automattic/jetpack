import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormStyleOutlineClassesAndStyles from '../shared/hooks/use-form-style-outline-classes-and-styles.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

function useInnerOptionsBlock( clientId ) {
	const inputBlock = useSelect(
		select => {
			// Get the parent block
			const parentBlock = select( blockEditorStore ).getBlock( clientId );
			if ( ! parentBlock ) {
				return {};
			}

			return parentBlock.innerBlocks.find( block => block.name === 'jetpack/options' );
		},
		[ clientId ]
	);

	return inputBlock;
}

export default function SingleChoiceFieldEdit( props ) {
	const { className, clientId, setAttributes, isSelected, attributes } = props;
	const { required, id, width } = attributes;

	useFormWrapper( props );

	const innerBlocks = useSelect(
		select => select( blockEditorStore ).getBlock( clientId ).innerBlocks,
		[ clientId ]
	);
	const options = innerBlocks?.[ 1 ]?.innerBlocks;
	const classes = clsx( className, 'jetpack-field jetpack-field-multiple', {
		'is-selected': isSelected,
		'has-placeholder': !! options?.length,
	} );

	const inputBlock = useInnerOptionsBlock( clientId );
	const styles = useFormStyleOutlineClassesAndStyles( {
		clientId,
		inputBlockName: inputBlock?.name,
		inputBlockAttributes: inputBlock?.attributes,
	} );

	const blockProps = useBlockProps( { className: classes, style: styles?.cssVars } );

	const innerBlockProps = useInnerBlocksProps( blockProps, {
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Choose one option', 'jetpack-forms' ),
					defaultLabel: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/options', { type: 'radio' } ],
		],
		templateLock: 'all',
	} );

	return (
		<>
			<div { ...innerBlockProps } />
			<JetpackFieldControls
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				type={ 'radio' }
				width={ width }
				hidePlaceholder
			/>
		</>
	);
}
