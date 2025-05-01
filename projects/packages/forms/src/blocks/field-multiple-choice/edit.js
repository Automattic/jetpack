import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { isNumber } from 'lodash';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { FORM_STYLE } from '../shared/util/constants';
import getBlockStyle from '../shared/util/get-block-style.js';

export default function MultipleChoiceFieldEdit( props ) {
	const { className, clientId, setAttributes, isSelected, attributes, context } = props;
	const { required, id, width } = attributes;

	useFormWrapper( props );
	const { blockStyle } = useJetpackFieldStyles( attributes );

	const firstInputBlock = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore );

			// Get the current (parent) block
			const parentBlock = getBlock( clientId );
			if ( ! parentBlock ) return null;

			// Find first input block within the innerBlocks
			return parentBlock.innerBlocks.find( block => block.name === 'jetpack/options' );
		},
		[ clientId ]
	);

	// Access the input block's attributes
	const inputBorderStyles = firstInputBlock?.attributes?.style?.border;
	const isOutlined = getBlockStyle( context?.[ 'jetpack/form-className' ] ) === FORM_STYLE.OUTLINED;
	let outlinedBorderStyles = {};
	if ( isOutlined && !! inputBorderStyles ) {
		outlinedBorderStyles = {
			'--jetpack--contact-form--border-size': isNumber( inputBorderStyles?.width )
				? `${ inputBorderStyles?.width }px`
				: inputBorderStyles?.width,
			'--jetpack--contact-form--border-color': inputBorderStyles?.color,
			'--jetpack--contact-form--border-radius': inputBorderStyles?.radius,
			'--jetpack--contact-form--border-style': inputBorderStyles?.style,
		};
	}

	const innerBlocks = useSelect(
		select => select( blockEditorStore ).getBlock( clientId ).innerBlocks,
		[ clientId ]
	);
	const options = innerBlocks?.[ 1 ]?.innerBlocks;
	const classes = clsx( className, 'jetpack-field jetpack-field-multiple', {
		'is-selected': isSelected,
		'has-placeholder': !! options?.length,
	} );

	const blockProps = useBlockProps( {
		className: classes,
		style: {
			...blockStyle,
			...outlinedBorderStyles,
		},
	} );
	console.log( 'MultipleChoiceFieldEdit', attributes, blockStyle, outlinedBorderStyles );
	const innerBlockProps = useInnerBlocksProps( blockProps, {
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Choose several options', 'jetpack-forms' ),
					defaultLabel: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/options', { type: 'checkbox' } ],
		],
		templateLock: 'all',
	} );

	return (
		<>
			<div { ...innerBlockProps } />
			<JetpackFieldControls
				blockClassNames={ classes }
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				type={ 'checkbox' }
				width={ width }
				hidePlaceholder
			/>
		</>
	);
}
