import { numberFormat } from '@automattic/jetpack-components';
import { isSimpleSite, useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import {
	ContrastChecker,
	PanelColorSettings,
	FontSizePicker,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	ToggleControl,
	PanelBody,
	RangeControl,
	TextareaControl,
	CheckboxControl,
} from '@wordpress/components';
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
	DEFAULT_SUBSCRIBE_PLACEHOLDER,
	DEFAULT_SUCCESS_MESSAGE,
} from './constants';

export default function SubscriptionControls( {
	availableNewsletterCategories,
	areNewsletterCategoriesEnabled,
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
	includeSocialFollowers,
	isGradientAvailable,
	padding,
	preselectNewsletterCategories,
	selectedNewsletterCategoryIds,
	setAttributes,
	setBorderColor,
	setButtonBackgroundColor,
	setTextColor,
	showSubscribersTotal,
	spacing,
	subscriberCount,
	textColor,
	buttonWidth,
	subscribePlaceholder = DEFAULT_SUBSCRIBE_PLACEHOLDER,
	successMessage = DEFAULT_SUCCESS_MESSAGE,
} ) {
	const { isModuleActive: isPublicizeEnabled } = useModuleStatus( 'publicize' );

	return (
		<>
			{ subscriberCount > 0 && (
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
							numberFormat( subscriberCount, { notation: 'compact', maximumFractionDigits: 1 } )
						),
						{ span: <span style={ { fontWeight: 'bold' } } /> }
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
					// This is changing in the future, and we need to do this to silence the deprecation warning.
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
				/>
			</PanelBody>
			<PanelBody
				title={ __( 'Border', 'jetpack' ) }
				initialOpen={ false }
				className="wp-block-jetpack-subscriptions__borderpanel"
			>
				<RangeControl
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
					value={ borderRadius }
					label={ __( 'Border Radius', 'jetpack' ) }
					min={ MIN_BORDER_RADIUS_VALUE }
					max={ MAX_BORDER_RADIUS_VALUE }
					initialPosition={ DEFAULT_BORDER_RADIUS_VALUE }
					allowReset
					onChange={ newBorderRadius => setAttributes( { borderRadius: newBorderRadius } ) }
				/>

				<RangeControl
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
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
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
					value={ padding }
					label={ __( 'Space Inside', 'jetpack' ) }
					min={ MIN_PADDING_VALUE }
					max={ MAX_PADDING_VALUE }
					initialPosition={ DEFAULT_PADDING_VALUE }
					allowReset
					onChange={ newPaddingValue => setAttributes( { padding: newPaddingValue } ) }
				/>
				<RangeControl
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
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
					__nextHasNoMarginBottom={ true }
					label={ __( 'Show subscriber count', 'jetpack' ) }
					checked={ showSubscribersTotal }
					onChange={ () => {
						setAttributes( {
							showSubscribersTotal: ! showSubscribersTotal,
							// Don't do anything if set previously, but by default set to false. We want to disencourage including social count as it's misleading.
							// We don't want to rely setting "default" in block.json to falsy, because the default value was previously "true".
							// Hence users without this set will still get social counts included in the subscriber counter.
							// Lowering the subscriber count on their behalf with code change would be controversial.
							includeSocialFollowers:
								typeof includeSocialFollowers === 'undefined' ? false : includeSocialFollowers,
						} );
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
				{ isPublicizeEnabled && (
					<ToggleControl
						__nextHasNoMarginBottom={ true }
						disabled={ ! showSubscribersTotal }
						label={ __( 'Include social followers in count', 'jetpack' ) }
						checked={
							typeof includeSocialFollowers === 'undefined' ? true : includeSocialFollowers
						}
						onChange={ () => {
							setAttributes( {
								includeSocialFollowers:
									typeof includeSocialFollowers === 'undefined' ? false : ! includeSocialFollowers,
							} );
						} }
					/>
				) }

				<ToggleControl
					__nextHasNoMarginBottom={ true }
					label={ __( 'Place button on new line', 'jetpack' ) }
					checked={ buttonOnNewLine }
					onChange={ () => {
						setAttributes( { buttonOnNewLine: ! buttonOnNewLine } );
					} }
				/>

				<TextareaControl
					__nextHasNoMarginBottom={ true }
					value={ subscribePlaceholder }
					label={ __( 'Input placeholder text', 'jetpack' ) }
					help={ __( 'Edit the placeholder text of the email address input.', 'jetpack' ) }
					onChange={ placeholder => setAttributes( { subscribePlaceholder: placeholder } ) }
				/>
				{ ! isSimpleSite() && (
					<TextareaControl
						__nextHasNoMarginBottom={ true }
						value={ successMessage }
						label={ __( 'Success message', 'jetpack' ) }
						help={ __( 'Edit the message displayed when a user subscribes.', 'jetpack' ) }
						onChange={ newSuccessMessage => setAttributes( { successMessage: newSuccessMessage } ) }
					/>
				) }
				{ areNewsletterCategoriesEnabled && availableNewsletterCategories.length > 0 && (
					<>
						<ToggleControl
							__nextHasNoMarginBottom={ true }
							label={ __( 'Pre-select categories', 'jetpack' ) }
							checked={ preselectNewsletterCategories }
							onChange={ value => {
								setAttributes( { preselectNewsletterCategories: value } );
							} }
							help={ __(
								'When enabled, the user will be automatically subscribed to the selected categories below when they submit the form.',
								'jetpack'
							) }
						/>
						{ preselectNewsletterCategories && (
							<fieldset>
								<legend className="wp-block-jetpack-subscriptions__legend">
									{ __( 'Categories', 'jetpack' ) }
								</legend>
								{ availableNewsletterCategories.map( category => (
									<CheckboxControl
										key={ category.id }
										__nextHasNoMarginBottom={ true }
										disabled={ ! preselectNewsletterCategories }
										label={ category.name }
										checked={ selectedNewsletterCategoryIds.includes( category.id ) }
										onChange={ () => {
											const selectedIds = selectedNewsletterCategoryIds.includes( category.id )
												? selectedNewsletterCategoryIds.filter( id => id !== category.id )
												: [ ...selectedNewsletterCategoryIds, category.id ];

											const updates = { selectedNewsletterCategoryIds: selectedIds };

											// If no categories are selected, disable the preselect option
											if ( selectedIds.length === 0 ) {
												updates.preselectNewsletterCategories = false;
											}

											setAttributes( updates );
										} }
									/>
								) ) }
							</fieldset>
						) }
					</>
				) }
			</PanelBody>
		</>
	);
}
