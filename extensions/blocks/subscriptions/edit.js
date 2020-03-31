/**
 * External dependencies
 */
import classnames from 'classnames';
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
import './shared.scss';

const { getComputedStyle } = window;
const isGradientAvailable = !! useGradient;

// TODO Update this to support fallback for new colors
const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, emailFieldBackgroundColor } = ownProps;
	const backgroundColorValue = emailFieldBackgroundColor && emailFieldBackgroundColor.color;
	const textColorValue = textColor && textColor.color;

	const textNode =
		! textColorValue && node ? node.querySelector( '[contenteditable="true"]' ) : null;

	return {
		fallbackEmailFieldBackgroundColor:
			backgroundColorValue || ! node ? undefined : getComputedStyle( node ).backgroundColor,
		fallbackTextColor:
			textColorValue || ! textNode ? undefined : getComputedStyle( textNode ).color,
	};
} );

function SubscriptionEdit( props ) {
	const {
		className,
		attributes,
		setAttributes,
		emailFieldBackgroundColor,
		//setEmailFieldBackgroundColor,
		buttonBackgroundColor,
		fallbackButtonBackgroundColor,
		setButtonBackgroundColor,
		textColor,
		fallbackTextColor,
		setTextColor,
		borderColor,
		setBorderColor,
		fontSize,
		setFontSize,
	} = props;

	const {
		borderRadius,
		borderWeight,
		padding,
		spacing,
		submitButtonText,
		subscribePlaceholder,
		showSubscribersTotal,
		buttonOnNewLine,
	} = attributes;

	const MIN_BORDER_RADIUS_VALUE = 0;
	const MAX_BORDER_RADIUS_VALUE = 50;
	const MIN_BORDER_WEIGHT_VALUE = 0;
	const MAX_BORDER_WEIGHT_VALUE = 15;
	const MIN_PADDING_VALUE = 5;
	const MAX_PADDING_VALUE = 50;
	const MIN_SPACING_VALUE = 0;
	const MAX_SPACING_VALUE = 50;

	const [ subscriberCountString, setSubscriberCountString ] = useState( '' );
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

	const sharedStyles = {
		color: textColor.color,
		borderColor: borderColor.color,
		borderRadius: borderRadius + 'px',
		borderWidth: borderWeight + 'px',
		fontSize: fontSize.size + 'px',
		padding:
			padding +
			'px ' +
			Math.round( padding * 1.5 ) +
			'px ' +
			padding +
			'px ' +
			Math.round( padding * 1.5 ) +
			'px',
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
		...( buttonOnNewLine ? { marginTop: spacing + 'px' } : { marginLeft: spacing + 'px' } ),
	};

	const getSubscriberCount = () => {
		apiFetch( { path: '/wpcom/v2/subscribers/count' } ).then( count => {
			// Handle error condition
			if ( ! count.hasOwnProperty( 'count' ) ) {
				setSubscriberCountString( __( 'Subscriber count unavailable', 'jetpack' ) );
			} else {
				setSubscriberCountString(
					sprintf(
						_n( 'Join %s other subscriber', 'Join %s other subscribers', count.count, 'jetpack' ),
						count.count
					)
				);
			}
		} );
	};

	const getBlockClassName = () => {
		return classnames(
			className,
			buttonOnNewLine ? 'wp-block-jetpack-subscriptions__newline' : undefined,
			showSubscribersTotal ? 'wp-block-jetpack-subscriptions__showsubs' : undefined
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
							// Disable support for email field background color in the UI for now.
							// {
							// 	colorValue: emailFieldBackgroundColor.color,
							// 	onColorChange: setEmailFieldBackgroundColor,
							// 	gradientValue: emailFieldGradient.gradientValue,
							// 	onGradientChange: emailFieldGradient.setGradient,
							// 	label: __( 'Email Field', 'jetpack' ),
							// },
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
								onColorChange: setBorderColor,
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
							// {
							// 	value: emailFieldBackgroundColor.color,
							// 	onChange: setEmailFieldBackgroundColor,
							// 	label: __( 'Email Field', 'jetpack' ),
							// },
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
								onChange: setBorderColor,
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
					title={ __( 'Text Settings' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__textpanel"
				>
					<FontSizePicker value={ fontSize.size } onChange={ setFontSize } />
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
						initialPosition={ borderRadius.default }
						allowReset
						onChange={ newBorderRadius => setAttributes( { borderRadius: newBorderRadius } ) }
					/>

					<RangeControl
						value={ borderWeight }
						label={ __( 'Border Weight', 'jetpack' ) }
						min={ MIN_BORDER_WEIGHT_VALUE }
						max={ MAX_BORDER_WEIGHT_VALUE }
						initialPosition={ borderWeight.default }
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
						initialPosition={ padding.default }
						allowReset
						onChange={ newPaddingValue => setAttributes( { padding: newPaddingValue } ) }
					/>

					<RangeControl
						value={ spacing }
						label={ __( 'Space Between', 'jetpack' ) }
						min={ MIN_SPACING_VALUE }
						max={ MAX_SPACING_VALUE }
						initialPosition={ spacing.default }
						allowReset
						onChange={ newSpacingValue => setAttributes( { spacing: newSpacingValue } ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Display Settings' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__displaypanel"
				>
					<ToggleControl
						label={ __( 'Show subscriber count', 'jetpack' ) }
						checked={ showSubscribersTotal }
						onChange={ () => {
							setAttributes( { showSubscribersTotal: ! showSubscribersTotal } );
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
						className={ classnames( buttonClasses, 'wp-block-jetpack-subscriptions__button' ) }
						onChange={ value => setAttributes( { submitButtonText: value } ) }
						style={ buttonStyles }
						value={ submitButtonText }
						withoutInteractiveFormatting
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
