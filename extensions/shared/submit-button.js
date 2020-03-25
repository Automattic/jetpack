// @see https://github.com/WordPress/gutenberg/blob/015555fcdf648b13af57e08cee60bf3f3501ff63/packages/block-library/src/button/edit.js
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	ContrastChecker,
	InspectorControls,
	PanelColorSettings,
	RichText,
	withColors,
	FontSizePicker,
	withFontSizes,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalUseGradient as useGradient,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl, withFallbackStyles } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const { getComputedStyle } = window;

const isGradientAvailable = !! useGradient;

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps;
	const backgroundColorValue = backgroundColor && backgroundColor.color;
	const textColorValue = textColor && textColor.color;
	//avoid the use of querySelector if textColor color is known and verify if node is available.
	const textNode =
		! textColorValue && node ? node.querySelector( '[contenteditable="true"]' ) : null;
	return {
		fallbackBackgroundColor:
			backgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor:
			textColorValue || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} );

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
		<PanelBody title={ __( 'Button Border Settings', 'jetpack' ) } initialOpen={ false }>
			<RangeControl
				value={ borderRadius }
				label={ __( 'Border Radius', 'jetpack' ) }
				min={ MIN_BORDER_RADIUS_VALUE }
				max={ MAX_BORDER_RADIUS_VALUE }
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				allowReset
				onChange={ setBorderRadius }
			/>
		</PanelBody>
	);
}

function SubmitButton( {
	attributes,
	backgroundColor,
	className,
	fallbackBackgroundColor,
	fallbackTextColor,
	setAttributes,
	setBackgroundColor,
	setTextColor,
	textColor,
	fontSize,
	setFontSize,
} ) {
	const { borderRadius, submitButtonText } = attributes;

	const { gradientClass, gradientValue, setGradient } = isGradientAvailable ? useGradient() : {};

	const classes = classnames( className, 'wp-block-button__link', {
		'has-background': backgroundColor.color || gradientValue,
		[ backgroundColor.class ]: ! gradientValue && backgroundColor.class,
		'has-text-color': textColor.color,
		[ textColor.class ]: textColor.class,
		[ gradientClass ]: gradientClass,
		'no-border-radius': borderRadius === 0,
		[ fontSize.class ]: fontSize.class,
	} );

	const styles = {
		...( ! backgroundColor.color && gradientValue
			? { background: gradientValue }
			: { backgroundColor: backgroundColor.color } ),
		color: textColor.color,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	return (
		<div className="wp-block-button">
			<RichText
				allowedFormats={ [] }
				className={ classes }
				onChange={ value => setAttributes( { submitButtonText: value } ) }
				placeholder={ __( 'Add text…', 'jetpack' ) }
				style={ styles }
				value={ submitButtonText }
				withoutInteractiveFormatting
			/>

			<InspectorControls>
				<PanelBody title={ __( 'Button Text Settings' ) } initialOpen={ false }>
					<FontSizePicker value={ fontSize.size } onChange={ setFontSize } />
				</PanelBody>
				{ isGradientAvailable && (
					<PanelColorGradientSettings
						title={ __( 'Button Color Settings', 'jetpack' ) }
						settings={ [
							{
								colorValue: textColor.color,
								onColorChange: setTextColor,
								label: __( 'Text Color', 'jetpack' ),
							},
							{
								colorValue: backgroundColor.color,
								onColorChange: setBackgroundColor,
								gradientValue,
								onGradientChange: setGradient,
								label: __( 'Background', 'jetpack' ),
							},
						] }
						initialOpen={ false }
					>
						<ContrastChecker
							{ ...{
								fontSize: fontSize.size,
								textColor: textColor.color,
								backgroundColor: backgroundColor.color,
								fallbackBackgroundColor,
								fallbackTextColor,
							} }
						/>
					</PanelColorGradientSettings>
				) }
				{ ! isGradientAvailable && (
					<PanelColorSettings
						title={ __( 'Button Color Settings', 'jetpack' ) }
						colorSettings={ [
							{
								value: textColor.color,
								onChange: setTextColor,
								label: __( 'Text Color', 'jetpack' ),
							},
							{
								value: backgroundColor.color,
								onChange: setBackgroundColor,
								label: __( 'Background', 'jetpack' ),
							},
						] }
						initialOpen={ false }
					>
						<ContrastChecker
							{ ...{
								fontSize: fontSize.size,
								textColor: textColor.color,
								backgroundColor: backgroundColor.color,
								fallbackBackgroundColor,
								fallbackTextColor,
							} }
						/>
					</PanelColorSettings>
				) }
				<BorderPanel borderRadius={ borderRadius } setAttributes={ setAttributes } />
			</InspectorControls>
		</div>
	);
}

export default compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withFontSizes( 'fontSize' ),
	applyFallbackStyles,
] )( SubmitButton );
