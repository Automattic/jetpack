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
import './editor.scss';

const { getComputedStyle } = window;
const isGradientAvailable = !! useGradient;

const applyFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor } = ownProps;
	const backgroundColorValue = backgroundColor && backgroundColor.color;
	const textColorValue = textColor && textColor.color;

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

const MIN_BORDER_WEIGHT_VALUE = 0;
const MAX_BORDER_WEIGHT_VALUE = 15;
const INITIAL_BORDER_WEIGHT_POSITION = 5;

function SubscriptionEdit( props ) {
	const {
		className,
		attributes,
		setAttributes,
		backgroundColor,
		fallbackBackgroundColor,
		setBackgroundColor,
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
		submitButtonText,
		subscribePlaceholder,
		showSubscribersTotal,
	} = attributes;

	const [ subscriberCountString, setSubscriberCountString ] = useState( '' );
	const { gradientClass, gradientValue, setGradient } = isGradientAvailable ? useGradient() : {};

	const classes = {
		'has-background': backgroundColor.color || gradientValue,
		[ backgroundColor.class ]: ! gradientValue && backgroundColor.class,
		'has-text-color': textColor.color,
		[ textColor.class ]: textColor.class,
		[ gradientClass ]: gradientClass,
		'no-border-radius': borderRadius === 0,
		[ fontSize.class ]: fontSize.class,
	};

	const styles = {
		...( ! backgroundColor.color && gradientValue
			? { background: gradientValue }
			: { backgroundColor: backgroundColor.color } ),
		color: textColor.color,
		borderColor: borderColor.color,
		borderRadius: borderRadius ? borderRadius + 'px' : 0,
		borderWidth: borderWeight ? borderWeight + 'px' : 0,
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	const get_subscriber_count = () => {
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

	useEffect( () => {
		get_subscriber_count();
	}, [] );

	return (
		<>
			<InspectorControls>
				{ isGradientAvailable && (
					<PanelColorGradientSettings
						title={ __( 'Background Colors', 'jetpack' ) }
						className="wp-block-jetpack-subscriptions__backgroundpanel"
						settings={ [
							{
								colorValue: backgroundColor.color,
								onColorChange: setBackgroundColor,
								gradientValue,
								onGradientChange: setGradient,
								label: __( 'Email Field', 'jetpack' ),
							},
							{
								colorValue: backgroundColor.color,
								onColorChange: setBackgroundColor,
								gradientValue,
								onGradientChange: setGradient,
								label: __( 'Button', 'jetpack' ),
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
						title={ __( 'Background Colors', 'jetpack' ) }
						className="wp-block-jetpack-subscriptions__backgroundpanel"
						colorSettings={ [
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

				<PanelBody
					title={ __( 'Text Settings' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__textpanel"
				>
					<FontSizePicker value={ fontSize.size } onChange={ setFontSize } withSlider={ true } />

					<PanelColorSettings
						title={ __( '', 'jetpack' ) }
						className="wp-block-jetpack-subscriptions__textcolorpanel"
						colorSettings={ [
							{
								value: textColor.color,
								onChange: setTextColor,
								label: __( 'Button Text Color', 'jetpack' ),
							},
						] }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Border Settings', 'jetpack' ) }
					initialOpen={ true }
					className="wp-block-jetpack-subscriptions__borderpanel"
				>
					<RangeControl
						value={ borderRadius }
						label={ __( 'Border Radius', 'jetpack' ) }
						min={ MIN_BORDER_RADIUS_VALUE }
						max={ MAX_BORDER_RADIUS_VALUE }
						initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
						allowReset
						onChange={ newBorderRadius => setAttributes( { borderRadius: newBorderRadius } ) }
					/>

					<RangeControl
						value={ borderWeight }
						label={ __( 'Border Weight', 'jetpack' ) }
						min={ MIN_BORDER_WEIGHT_VALUE }
						max={ MAX_BORDER_WEIGHT_VALUE }
						initialPosition={ INITIAL_BORDER_WEIGHT_POSITION }
						allowReset
						onChange={ newBorderWeight => setAttributes( { borderWeight: newBorderWeight } ) }
					/>

					<PanelColorSettings
						title={ __( '', 'jetpack' ) }
						className="wp-block-jetpack-subscriptions__bordercolorpanel"
						colorSettings={ [
							{
								value: borderColor.color,
								onChange: setBorderColor,
								label: __( 'Border Color', 'jetpack' ),
							},
						] }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Spacing Settings', 'jetpack' ) }
					initialOpen={ false }
					className="wp-block-jetpack-subscriptions__spacingpanel"
				>
					<RangeControl
						value={ borderRadius }
						label={ __( 'Space Inside', 'jetpack' ) }
						min={ MIN_BORDER_RADIUS_VALUE }
						max={ MAX_BORDER_RADIUS_VALUE }
						initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
						allowReset
						onChange={ newBorderRadius => setAttributes( { borderRadius: newBorderRadius } ) }
					/>

					<RangeControl
						value={ borderRadius }
						label={ __( 'Space Between', 'jetpack' ) }
						min={ MIN_BORDER_RADIUS_VALUE }
						max={ MAX_BORDER_RADIUS_VALUE }
						initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
						allowReset
						onChange={ newBorderRadius => setAttributes( { borderRadius: newBorderRadius } ) }
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
						checked={ showSubscribersTotal }
						onChange={ () => {
							setAttributes( { showSubscribersTotal: ! showSubscribersTotal } );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			<div className={ className } role="form">
				{ showSubscribersTotal && <p role="heading">{ subscriberCountString }</p> }

				<TextControl
					placeholder={ subscribePlaceholder }
					disabled={ true }
					className={ classnames( classes, 'wp-block-jetpack-subscriptions__textfield' ) }
					style={ styles }
				/>

				<RichText
					allowedFormats={ [] }
					className={ classnames( classes, 'wp-block-jetpack-subscriptions__button' ) }
					onChange={ value => setAttributes( { submitButtonText: value } ) }
					placeholder={ __( 'Add text…', 'jetpack' ) }
					style={ styles }
					value={ submitButtonText }
					withoutInteractiveFormatting
				/>
			</div>
		</>
	);
}

export default compose( [
	withColors( 'backgroundColor', 'borderColor', { textColor: 'color' } ),
	withFontSizes( 'fontSize' ),
	applyFallbackStyles,
] )( SubscriptionEdit );
