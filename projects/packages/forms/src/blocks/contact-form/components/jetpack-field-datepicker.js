import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { SelectControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { DATE_FORMAT_OPTIONS } from '../util/constants';
import { useFormWrapper } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const ALLOWED_BLOCKS = [ 'jetpack/field-label', 'jetpack/field-input' ];

const JetpackDatePicker = props => {
	const { attributes, clientId, isSelected, name, setAttributes } = props;
	const { id, label, required, requiredText, width, placeholder, dateFormat } = attributes;

	useFormWrapper( { attributes, clientId, name } );

	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field', {
			'is-selected': isSelected,
			'has-placeholder': !! placeholder,
		} ),
		style: blockStyle,
	} );

	const labelBlockType = getBlockType( 'jetpack/field-label' );
	const defaultLabel = labelBlockType.attributes.label.default;
	const template = useMemo( () => {
		return [
			[ 'jetpack/field-label', { label, required, defaultLabel, requiredText } ],
			[ 'jetpack/field-input' ],
		];
	}, [ label, defaultLabel, required, requiredText ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template,
		templateLock: 'all',
	} );

	const onChange = useCallback(
		value => {
			setAttributes( { dateFormat: value } );
		},
		[ setAttributes ]
	);

	return (
		<>
			<div { ...innerBlocksProps } />
			<JetpackFieldControls
				id={ id }
				required={ required }
				width={ width }
				setAttributes={ setAttributes }
				placeholder={ placeholder }
				attributes={ attributes }
				type="date"
				extraFieldSettings={ [
					{
						index: 1,
						element: (
							<SelectControl
								key="date-format"
								label={ __( 'Date Format', 'jetpack-forms' ) }
								options={ DATE_FORMAT_OPTIONS }
								onChange={ onChange }
								value={ dateFormat }
								help={ __(
									'Select the format in which the date will be displayed.',
									'jetpack-forms'
								) }
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
							/>
						),
					},
				] }
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] )
)( JetpackDatePicker );
