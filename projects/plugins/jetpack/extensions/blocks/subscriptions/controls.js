import { numberFormat } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import {
	ContrastChecker,
	PanelColorSettings,
	FontSizePicker,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { ToggleControl, PanelBody, RangeControl, TextareaControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import InspectorNotice from '../../shared/components/inspector-notice';
import { WidthControl } from '../../shared/width-panel';
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

export default function SubscriptionControls( {
	buttonBackgroundColor,
	borderColor,
	buttonGradient,
	borderRadius,
	borderWeight,
	buttonOnNewLine,
	emailFieldBackgroundColor,
	fallbackButtonBackgroundColor,
	fallbackTextColor,
	fontSize,
	isGradientAvailable,
	padding,
	setAttributes,
	setBorderColor,
	setButtonBackgroundColor,
	setTextColor,
	showSubscribersTotal,
	spacing,
	subscriberCount,
	textColor,
	buttonWidth,
	successMessage,
} ) {
	return (
		<>
			{ subscriberCount > 1 && (
				<InspectorNotice>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s is the number of subscribers. The \xA0 non-breaking space is to make sure the last two words are on the same line. */
							_n(
								'<span>%s reader</span> is\xA0subscribed.',
								'<span>%s readers</span> are\xA0subscribed.',
								subscriberCount,
								'jetpack'
							),
							numberFormat( subscriberCount )
						),
						{ span: <span style={ { textDecoration: 'underline' } } /> }
					) }
				</InspectorNotice>
			) }
			{ isGradientAvailable && (
				<PanelColorGradientSettings
					title={ __( 'Color', 'jetpack' ) }
					className="wp-block-jetpack-subscriptions__backgroundpanel"
					settings={ [
						{
							colorValue: buttonBackgroundColor.color,
							onColorChange: setButtonBackgroundColor,
							gradientValue: buttonGradient.gradientValue,
							onGradientChange: buttonGradient.setGradient,
							label: __( 'Button Background', 'jetpack' ),
						},
						{
							colorValue: textColor.color,
							onColorChange: setTextColor,
							label: __( 'Button Text', 'jetpack' ),
						},
						{
							colorValue: borderColor.color,
							onColorChange: setBorderColor,
							label: __( 'Border', 'jetpack' ),
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
							onColorChange: setBorderColor,
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
				title={ __( 'Typography', 'jetpack' ) }
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
				title={ __( 'Border', 'jetpack' ) }
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
				title={ __( 'Spacing', 'jetpack' ) }
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

				<WidthControl
					width={ buttonWidth }
					onChange={ newButtonWidth => setAttributes( { buttonWidth: newButtonWidth } ) }
				/>
			</PanelBody>
			<PanelBody
				title={ __( 'Settings', 'jetpack' ) }
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
								'This will remain hidden until there is at least one subscriber.',
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
				{ ! isSimpleSite() && (
					<TextareaControl
						value={ successMessage }
						label={ __( 'Success message', 'jetpack' ) }
						help={ __( 'Edit the message displayed when a user subscribes.', 'jetpack' ) }
						onChange={ newSuccessMessage => setAttributes( { successMessage: newSuccessMessage } ) }
					/>
				) }
			</PanelBody>
		</>
	);
}
