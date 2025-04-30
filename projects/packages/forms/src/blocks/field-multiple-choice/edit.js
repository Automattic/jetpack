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
		},
	} );
	console.log( 'MultipleChoiceFieldEdit', attributes, blockStyle );
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
