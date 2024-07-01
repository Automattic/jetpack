import { InspectorControls, RichText, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import ColorEdit from './color-edit';
import getColorAndStyleProps from './color-props';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;
const INITIAL_BORDER_RADIUS_POSITION = 5;

function BorderPanel( { borderRadius = '', setAttributes } ) {
	const setBorderRadius = useCallback(
		newBorderRadius => {
			setAttributes( { borderRadius: newBorderRadius } );
		},
		[ setAttributes ]
	);
	return (
		<PanelBody title={ __( 'Border settings', 'jetpack' ) }>
			<RangeControl
				value={ borderRadius }
				label={ __( 'Border radius', 'jetpack' ) }
				min={ MIN_BORDER_RADIUS_VALUE }
				max={ MAX_BORDER_RADIUS_VALUE }
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				allowReset
				onChange={ setBorderRadius }
			/>
		</PanelBody>
	);
}

function LoginButtonEdit( props ) {
	const { attributes, setAttributes, className } = props;
	const { borderRadius, text } = attributes;

	const colorProps = getColorAndStyleProps( attributes );

	const blockProps = useBlockProps( {
		className: 'wp-block-button',
	} );

	return (
		<>
			{ /* eslint-disable-next-line wpcalypso/jsx-classname-namespace */ }
			<div { ...blockProps }>
				<RichText
					placeholder={ __( 'Add text…', 'jetpack' ) }
					value={ text }
					onChange={ value => setAttributes( { text: value } ) }
					withoutInteractiveFormatting
					className={ clsx( className, 'wp-block-button__link', colorProps.className, {
						'no-border-radius': borderRadius === 0,
					} ) }
					style={ {
						borderRadius: borderRadius ? borderRadius + 'px' : undefined,
						...colorProps.style,
					} }
				/>
			</div>
			<InspectorControls>
				<ColorEdit { ...props } />
				<BorderPanel borderRadius={ borderRadius } setAttributes={ setAttributes } />
			</InspectorControls>
		</>
	);
}

export default LoginButtonEdit;
