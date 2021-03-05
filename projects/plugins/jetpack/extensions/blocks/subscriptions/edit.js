/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEqual } from 'lodash';
import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	TextControl,
	ToggleControl,
	PanelBody,
	RangeControl,
	withFallbackStyles,
} from '@wordpress/components';
import {
	InspectorControls,
	ContrastChecker,
	PanelColorSettings,
	RichText,
	withColors,
	FontSizePicker,
	withFontSizes,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalUseGradient as useGradient,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import './view.scss';
import defaultAttributes from './attributes';
import { getValidatedAttributes } from '../../shared/get-validated-attributes';
import {
	MIN_BORDER_RADIUS_VALUE,
	MAX_BORDER_RADIUS_VALUE,
	DEFAULT_BORDER_RADIUS_VALUE,
	MIN_BORDER_WEIGHT_VALUE,
	MAX_BORDER_WEIGHT_VALUE,
	DEFAULT_BORDER_WEIGHT_VALUE,
	MIN_PADDING_VALUE,
	MAX_PADDING_VALUE,
	DEFAULT_PADDING_VALUE,
	MIN_SPACING_VALUE,
	MAX_SPACING_VALUE,
	DEFAULT_SPACING_VALUE,
	DEFAULT_FONTSIZE_VALUE,
} from './constants';

const { getComputedStyle } = window;
const isGradientAvailable = !! useGradient;

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { buttonBackgroundColor, textColor } = ownProps;
	const buttonBackgroundColorValue = buttonBackgroundColor && buttonBackgroundColor.color;
	const textColorValue = textColor && textColor.color;

	const buttonNode = node.querySelector( '.wp-block-jetpack-subscriptions__button' );

	return {
		fallbackButtonBackgroundColor:
			buttonBackgroundColorValue || ! node
				? undefined
				: buttonNode && getComputedStyle( buttonNode ).backgroundColor,
		fallbackTextColor:
			textColorValue || ! node ? undefined : buttonNode && getComputedStyle( buttonNode ).color,
	};
} );

function SubscriptionEdit( props ) {
	const {
		className,
		attributes,
		setAttributes,
		emailFieldBackgroundColor,
		buttonBackgroundColor,
		setButtonBackgroundColor,
		fallbackButtonBackgroundColor,
		textColor,
		fallbackTextColor,
		setTextColor,
		borderColor,
		fontSize,
	} = props;

	const validatedAttributes = getValidatedAttributes( defaultAttributes, attributes );
	if ( ! isEqual( validatedAttributes, attributes ) ) {
		setAttributes( validatedAttributes );
	}

	const {
		borderRadius,
		borderWeight,
		padding,
		spacing,
		submitButtonText,
		subscribePlaceholder,
		showSubscribersTotal,
		buttonOnNewLine,
	} = validatedAttributes;

	const [ subscriberCountString, setSubscriberCountString ] = useState( '' );
	const [ subscriberCount, setSubscriberCount ] = useState( '' );

	const emailFieldGradient = isGradientAvailable
		? useGradient( {
				gradientAttribute: 'emailFieldGradient',
				customGradientAttribute: 'customEmailFieldGradient',
		  } )
		: {};
	const buttonGradient = isGradientAvailable
		? useGradient( {
				gradientAttribute: 'buttonGradient',
				customGradientAttribute: 'customButtonGradient',
		  } )
		: {};

	const sharedClasses = {
		'no-border-radius': borderRadius === 0,
		[ fontSize.class ]: fontSize.class,
		'has-text-color': textColor.color,
		[ textColor.class ]: textColor.class,
	};

	const emailFieldClasses = {
		...sharedClasses,
		'has-background': emailFieldBackgroundColor.color || emailFieldGradient.gradientValue,
		[ emailFieldBackgroundColor.class ]:
			! emailFieldGradient.gradientValue && emailFieldBackgroundColor.class,
		[ emailFieldGradient.gradientClass ]: emailFieldGradient.gradientClass,
	};

	const buttonClasses = {
		...sharedClasses,
		'has-background': buttonBackgroundColor.color || buttonGradient.gradientValue,
		[ buttonBackgroundColor.class ]: ! buttonGradient.gradientValue && buttonBackgroundColor.class,
		[ buttonGradient.gradientClass ]: buttonGradient.gradientClass,
	};

	const getPaddingStyleValue = paddingValue => {
		const value = paddingValue ? paddingValue : DEFAULT_PADDING_VALUE;

		return (
			value +
			'px ' +
			Math.round( value * 1.5 ) +
			'px ' +
			value +
			'px ' +
			Math.round( value * 1.5 ) +
			'px'
		);
	};

	const getSpacingStyleValue = spacingValue => {
		return spacingValue ? spacingValue : DEFAULT_SPACING_VALUE;
	};

	const sharedStyles = {
		color: textColor.color,
		borderColor: borderColor.color,
		borderRadius: borderRadius ? borderRadius + 'px' : DEFAULT_BORDER_RADIUS_VALUE + 'px',
		borderWidth: borderWeight ? borderWeight + 'px' : DEFAULT_BORDER_WEIGHT_VALUE + 'px',
		fontSize: fontSize.size ? fontSize.size : DEFAULT_FONTSIZE_VALUE,
		padding: getPaddingStyleValue( padding ),
	};

	const emailFieldStyles = {
		...sharedStyles,
		...( ! emailFieldBackgroundColor.color && emailFieldGradient.gradientValue
			? { background: emailFieldGradient.gradientValue }
			: { backgroundColor: emailFieldBackgroundColor.color } ),
	};

	const buttonStyles = {
		...sharedStyles,
		...( ! buttonBackgroundColor.color && buttonGradient.gradientValue
			? { background: buttonGradient.gradientValue }
			: { backgroundColor: buttonBackgroundColor.color } ),
		...( buttonOnNewLine
			? { marginTop: getSpacingStyleValue( spacing ) + 'px' }
			: { marginLeft: getSpacingStyleValue( spacing ) + 'px' } ),
	};

	const getSubscriberCount = () => {
		apiFetch( { path: '/wpcom/v2/subscribers/count' } ).then( count => {
			// Handle error condition
			if ( ! count.hasOwnProperty( 'count' ) ) {
				setSubscriberCountString( __( 'Subscriber count unavailable', 'jetpack' ) );
				setSubscriberCount( 0 );
			} else {
				setSubscriberCountString(
					sprintf(
						/* translators: Placeholder is a number of subscribers. */
						_n( 'Join %s other subscriber', 'Join %s other subscribers', count.count, 'jetpack' ),
						count.count
					)
				);
				setSubscriberCount( count.count );
			}
		} );
	};

	const getBlockClassName = () => {
		return classnames(
			className,
			'wp-block-jetpack-subscriptions__supports-newline',
			buttonOnNewLine ? 'wp-block-jetpack-subscriptions__use-newline' : undefined,
			showSubscribersTotal ? 'wp-block-jetpack-subscriptions__show-subs' : undefined
		);
	};

	useEffect( () => {
		getSubscriberCount();
	}, [] );

	return (
		<>
			<InspectorControls>
				{ isGradientAvailable && (
					<PanelColorGradientSettings
						title={ __( 'Color Settings', 'jetpack' ) }
						className="wp-block-jetpack-subscriptions__backgroundpanel"
						settings={ [
							{
								colorValue: buttonBackgroundColor.color,
								onColorChange: setButtonBackgroundColor,
								gradientValue: buttonGradient.gradientValue,
								onGradientChange: buttonGradient.setGradient,
								label: __( 'Button Background Color', 'jetpack' ),
							},
							{
								colorValue: textColor.color,
								onColorChange: setTextColor,
								label: __( 'Button Text Color', 'jetpack' ),
							},
							{
								colorValue: borderColor.color,
								onColorChange: newBorderColor => {
									// Note: setBorderColor from withColors hook does not
									// work correctly with shortcode border color rendering.
									setAttributes( {
										borderColor: newBorderColor,
										customBorderColor: newBorderColor,
									} );
								},
								label: __( 'Border Color', 'jetpack' ),
							},
						] }
						initialOpen={ true }
					>
						<ContrastChecker
							{ ...{
								fontSize: fontSize.size,
								textColor: textColor.color,
								backgroundColor: emailFieldBackgroundColor.color,
								fallbackButtonBackgroundColor,
								fallbackTextColor,
							} }
						/>
					</PanelColorGradientSettings>
				) }
				{ ! isGradientAvailable && (
					<PanelColorSettings
						title={ __( 'Background Colors', 'jetpack' ) }
						className="wp-block-jetpack-subscriptions__backgroundpanel"
						colorSettings={ [
							{
								value: buttonBackgroundColor.color,
								onChange: setButtonBackgroundColor,
								label: __( 'Button Background Color', 'jetpack' ),
							},
							{
								value: textColor.color,
								onChange: setTextColor,
								label: __( 'Button Text Color', 'jetpack' ),
							},
							{
								value: borderColor.color,
								onColorChange: newBorderColor => {
									// Note: setBorderColor from withColors hook does not
									// work correctly with shortcode border color rendering.
									setAttributes( {
										borderColor: newBorderColor,
										customBorderColor: newBorderColor,
									} );
								},
								label: __( 'Border Color', 'jetpack' ),
							},
						] }
						initialOpen={ false }
					>
						<ContrastChecker
							{ ...{
								fontSize: fontSize.size,
								textColor: textColor.color,
								backgroundColor: emailFieldBackgroundColor.color,
								fallbackButtonBackgroundColor,
								fallbackTextColor,
							} }
						/>
					</PanelColorSettings>
				) }

				<PanelBody
					title={ __( 'Text Settings', 'jetpack' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__textpanel"
				>
					<FontSizePicker
						withSlider={ true }
						value={ fontSize.size }
						onChange={ selectedFontSize => {
							// Note: setFontSize from withFontSizes hook does not
							// work correctly with shortcode font size rendering.
							const newFontSize = selectedFontSize ? selectedFontSize : DEFAULT_FONTSIZE_VALUE;
							setAttributes( {
								fontSize: newFontSize,
								customFontSize: newFontSize,
							} );
						} }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Border Settings', 'jetpack' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__borderpanel"
				>
					<RangeControl
						value={ borderRadius }
						label={ __( 'Border Radius', 'jetpack' ) }
						min={ MIN_BORDER_RADIUS_VALUE }
						max={ MAX_BORDER_RADIUS_VALUE }
						initialPosition={ DEFAULT_BORDER_RADIUS_VALUE }
						allowReset
						onChange={ newBorderRadius => setAttributes( { borderRadius: newBorderRadius } ) }
					/>

					<RangeControl
						value={ borderWeight }
						label={ __( 'Border Weight', 'jetpack' ) }
						min={ MIN_BORDER_WEIGHT_VALUE }
						max={ MAX_BORDER_WEIGHT_VALUE }
						initialPosition={ DEFAULT_BORDER_WEIGHT_VALUE }
						allowReset
						onChange={ newBorderWeight => setAttributes( { borderWeight: newBorderWeight } ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Spacing Settings', 'jetpack' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__spacingpanel"
				>
					<RangeControl
						value={ padding }
						label={ __( 'Space Inside', 'jetpack' ) }
						min={ MIN_PADDING_VALUE }
						max={ MAX_PADDING_VALUE }
						initialPosition={ DEFAULT_PADDING_VALUE }
						allowReset
						onChange={ newPaddingValue => setAttributes( { padding: newPaddingValue } ) }
					/>

					<RangeControl
						value={ spacing }
						label={ __( 'Space Between', 'jetpack' ) }
						min={ MIN_SPACING_VALUE }
						max={ MAX_SPACING_VALUE }
						initialPosition={ DEFAULT_SPACING_VALUE }
						allowReset
						onChange={ newSpacingValue => setAttributes( { spacing: newSpacingValue } ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Display Settings', 'jetpack' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__displaypanel"
				>
					<ToggleControl
						label={ __( 'Show subscriber count', 'jetpack' ) }
						checked={ showSubscribersTotal }
						onChange={ () => {
							setAttributes( { showSubscribersTotal: ! showSubscribersTotal } );
						} }
						help={ () => {
							if ( ! subscriberCount || subscriberCount < 1 ) {
								return __(
									'This will remain hidden on your website until you have at least one subscriber.',
									'jetpack'
								);
							}
						} }
					/>

					<ToggleControl
						label={ __( 'Place button on new line', 'jetpack' ) }
						checked={ buttonOnNewLine }
						onChange={ () => {
							setAttributes( { buttonOnNewLine: ! buttonOnNewLine } );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			<div className={ getBlockClassName() }>
				<div className="wp-block-jetpack-subscriptions__form" role="form">
					<TextControl
						placeholder={ subscribePlaceholder }
						disabled={ true }
						className={ classnames(
							emailFieldClasses,
							'wp-block-jetpack-subscriptions__textfield'
						) }
						style={ emailFieldStyles }
					/>

					<RichText
						className={ classnames(
							buttonClasses,
							'wp-block-jetpack-subscriptions__button',
							'wp-block-button__link'
						) }
						onChange={ value => setAttributes( { submitButtonText: value } ) }
						style={ buttonStyles }
						value={ submitButtonText }
						withoutInteractiveFormatting
						allowedFormats={ [ 'core/bold', 'core/italic', 'core/strikethrough' ] }
					/>
				</div>

				{ showSubscribersTotal && (
					<p className="wp-block-jetpack-subscriptions__subscount">{ subscriberCountString }</p>
				) }
			</div>
		</>
	);
}

export default compose( [
	withColors(
		{ emailFieldBackgroundColor: 'backgroundColor' },
		{ buttonBackgroundColor: 'backgroundColor' },
		{ textColor: 'color' },
		'borderColor'
	),
	withFontSizes( 'fontSize' ),
	applyFallbackStyles,
] )( SubscriptionEdit );
