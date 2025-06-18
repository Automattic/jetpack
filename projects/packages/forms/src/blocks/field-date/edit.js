import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFieldSelected from '../shared/hooks/use-field-selected';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';
import { ALLOWED_INNER_BLOCKS, DATE_FORMAT_OPTIONS } from '../shared/util/constants';

export default function DateFieldEdit( props ) {
	const { attributes, clientId, isSelected, name, setAttributes } = props;
	const { id, required, width, dateFormat } = attributes;

	useFormWrapper( { attributes, clientId, name } );
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected, hasPlaceholder } = useFieldSelected( clientId );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field', {
			'is-selected': isSelected || isInnerBlockSelected,
			'has-placeholder': hasPlaceholder,
		} ),
		style: blockStyle,
	} );

	const template = useMemo( () => {
		return [
			[ 'jetpack/label', { label: __( 'Date', 'jetpack-forms' ), required } ],
			[ 'jetpack/input' ],
		];
	}, [ required ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_INNER_BLOCKS,
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
}
