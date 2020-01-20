/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import { PanelBody, RangeControl, withFallbackStyles } from '@wordpress/components';
import {
	ContrastChecker,
	InspectorControls,
	PanelColorSettings,
	RichText,
	withColors,
} from '@wordpress/block-editor';

const { getComputedStyle } = window;

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
		<PanelBody title={ __( 'Border Settings' ) }>
			<RangeControl
				value={ borderRadius }
				label={ __( 'Border Radius' ) }
				min={ MIN_BORDER_RADIUS_VALUE }
				max={ MAX_BORDER_RADIUS_VALUE }
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				allowReset
				onChange={ setBorderRadius }
			/>
		</PanelBody>
	);
}

function ButtonEdit( {
	attributes,
	backgroundColor,
	textColor,
	setBackgroundColor,
	setTextColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	setAttributes,
	className,
} ) {
	const { borderRadius, text, title } = attributes;
	return (
		<div className={ className } title={ title }>
			<RichText
				placeholder={ __( 'Add text…' ) }
				value={ text }
				onChange={ value => setAttributes( { text: value } ) }
				withoutInteractiveFormatting
				className={ classnames( 'wp-block-button__link', {
					'has-background': backgroundColor.color,
					[ backgroundColor.class ]: backgroundColor.class,
					'has-text-color': textColor.color,
					[ textColor.class ]: textColor.class,
					'no-border-radius': borderRadius === 0,
				} ) }
				style={ {
					backgroundColor: backgroundColor.color,
					color: textColor.color,
					borderRadius: borderRadius ? borderRadius + 'px' : undefined,
				} }
			/>
			<InspectorControls>
				<PanelColorSettings
					title={ __( 'Color Settings' ) }
					colorSettings={ [
						{
							value: backgroundColor.color,
							onChange: newColor => {
								setBackgroundColor( newColor );
							},
							label: __( 'Background Color' ),
						},
						{
							value: textColor.color,
							onChange: setTextColor,
							label: __( 'Text Color' ),
						},
					] }
				>
					<ContrastChecker
						{ ...{
							// Text is considered large if font size is greater or equal to 18pt or 24px,
							// currently that's not the case for button.
							isLargeText: false,
							textColor: textColor.color,
							backgroundColor: backgroundColor.color,
							fallbackBackgroundColor,
							fallbackTextColor,
						} }
					/>
				</PanelColorSettings>
				<BorderPanel borderRadius={ borderRadius } setAttributes={ setAttributes } />
			</InspectorControls>
		</div>
	);
}

export default compose( [
	withInstanceId,
	withColors( 'backgroundColor', { textColor: 'color' } ),
	applyFallbackStyles,
] )( ButtonEdit );
