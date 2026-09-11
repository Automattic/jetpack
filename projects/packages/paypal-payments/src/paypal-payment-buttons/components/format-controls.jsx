/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — the Styles tab.
 *
 * The Styles tab — Embed as and the per-format output controls. The panel set
 * changes per format and, for QR, per the caption toggle, which block supports
 * cannot do: block.json declares them once and they cannot follow a checkbox.
 *
 * Modelled on projects/plugins/jetpack/extensions/blocks/donations/style-controls.jsx:
 * one `group="styles"` fill with core's controls inside our own ToolsPanels,
 * borrowing core's color classes for their spacing and reset.
 *
 * @package
 */

import {
	InspectorControls,
	__experimentalColorGradientControl as ColorGradientControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	BaseControl,
	CheckboxControl,
	RangeControl,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUnitControl as UnitControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getCaptionStyle } from '../utils/block-styles';
import { DEFAULT_QR_CAPTION } from '../utils/defaults';
import FormatSwitcher from './format-switcher';
import QrCodePreview from './qr-code-preview';

const PRESET_WIDTHS = [ '25%', '50%', '75%', '100%' ];
const WIDTH_UNITS = [
	{ value: '%', label: '%', default: 100 },
	{ value: 'px', label: 'px', default: 150 },
];

/**
 * Width Settings — 25/50/75/100 presets beside a free value.
 *
 * Same shape as the Jetpack plugin's shared width control, which a package
 * cannot import across the project boundary.
 *
 * @see projects/plugins/jetpack/extensions/shared/width-panel.jsx
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.blockWidth    - Current width, with its unit.
 * @param {Function} props.setAttributes - Update block attributes.
 * @return {Element} The Width Settings panel.
 */
function WidthPanel( { blockWidth, setAttributes } ) {
	// Clicking the selected preset clears it, the way the plugin's control does.
	const selectPreset = value => setAttributes( { blockWidth: blockWidth === value ? '' : value } );

	return (
		<ToolsPanel
			label={ __( 'Width Settings', 'jetpack-paypal-payments' ) }
			resetAll={ () => setAttributes( { blockWidth: '' } ) }
			headingLevel={ 3 }
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
		>
			<ToolsPanelItem
				label={ __( 'Width', 'jetpack-paypal-payments' ) }
				hasValue={ () => !! blockWidth }
				onDeselect={ () => setAttributes( { blockWidth: '' } ) }
				isShownByDefault
			>
				<div className="jetpack-paypal-payment-buttons__width-controls">
					<ToggleGroupControl
						label={ __( 'Width', 'jetpack-paypal-payments' ) }
						hideLabelFromVision
						value={ blockWidth }
						onChange={ selectPreset }
						isBlock
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					>
						{ PRESET_WIDTHS.map( preset => (
							<ToggleGroupControlOption key={ preset } value={ preset } label={ preset } />
						) ) }
					</ToggleGroupControl>
					<UnitControl
						label={ __( 'Custom width', 'jetpack-paypal-payments' ) }
						hideLabelFromVision
						value={ blockWidth }
						units={ WIDTH_UNITS }
						min={ 0 }
						onChange={ value => setAttributes( { blockWidth: value || '' } ) }
						__next40pxDefaultSize
					/>
				</div>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

/**
 * Border Settings — margin, radius and stroke in one panel.
 *
 * Core splits these up: margin lives in Dimensions and radius in Border.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @return {Element} The Border Settings panel.
 */
function BorderPanel( { attributes, setAttributes } ) {
	const {
		marginVertical,
		marginHorizontal,
		blockBorderRadius,
		blockBorderWidth,
		blockBorderColor,
	} = attributes;
	const hasMargin = marginVertical !== undefined || marginHorizontal !== undefined;

	return (
		<ToolsPanel
			label={ __( 'Border Settings', 'jetpack-paypal-payments' ) }
			resetAll={ () =>
				setAttributes( {
					marginVertical: undefined,
					marginHorizontal: undefined,
					blockBorderRadius: undefined,
					blockBorderWidth: undefined,
					blockBorderColor: '',
				} )
			}
			headingLevel={ 3 }
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
		>
			<ToolsPanelItem
				label={ __( 'Margin', 'jetpack-paypal-payments' ) }
				hasValue={ () => hasMargin }
				onDeselect={ () =>
					setAttributes( { marginVertical: undefined, marginHorizontal: undefined } )
				}
				isShownByDefault
			>
				<BaseControl.VisualLabel>
					{ __( 'Margin', 'jetpack-paypal-payments' ) }
				</BaseControl.VisualLabel>
				<RangeControl
					label={ __( 'Vertical', 'jetpack-paypal-payments' ) }
					value={ marginVertical }
					onChange={ value => setAttributes( { marginVertical: value } ) }
					min={ 0 }
					max={ 100 }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<RangeControl
					label={ __( 'Horizontal', 'jetpack-paypal-payments' ) }
					value={ marginHorizontal }
					onChange={ value => setAttributes( { marginHorizontal: value } ) }
					min={ 0 }
					max={ 100 }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				label={ __( 'Radius', 'jetpack-paypal-payments' ) }
				hasValue={ () => blockBorderRadius !== undefined }
				onDeselect={ () => setAttributes( { blockBorderRadius: undefined } ) }
				isShownByDefault
			>
				<RangeControl
					label={ __( 'Radius', 'jetpack-paypal-payments' ) }
					value={ blockBorderRadius }
					onChange={ value => setAttributes( { blockBorderRadius: value } ) }
					min={ 0 }
					max={ 50 }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				label={ __( 'Stroke', 'jetpack-paypal-payments' ) }
				hasValue={ () => blockBorderWidth !== undefined || !! blockBorderColor }
				onDeselect={ () => setAttributes( { blockBorderWidth: undefined, blockBorderColor: '' } ) }
				isShownByDefault
			>
				<RangeControl
					label={ __( 'Stroke', 'jetpack-paypal-payments' ) }
					value={ blockBorderWidth }
					onChange={ value => setAttributes( { blockBorderWidth: value } ) }
					min={ 0 }
					max={ 20 }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<ColorGradientControl
					label={ __( 'Stroke color', 'jetpack-paypal-payments' ) }
					colorValue={ blockBorderColor }
					onColorChange={ value => setAttributes( { blockBorderColor: value || '' } ) }
					disableCustomGradients
					enableAlpha={ false }
					__experimentalIsRenderedInSidebar
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

/**
 * The QR output controls — the code with a Download button, plus the caption
 * toggle and its text field.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @param {string}   props.qrUrl         - The attributed payment URL to encode.
 * @return {Element} The QR preview, Download, and the caption toggle and field.
 */
function QrOutputControls( { attributes, setAttributes, qrUrl } ) {
	const { qrShowCaption, qrCaption } = attributes;
	// The inspector's copy of the code carries the caption too, so the merchant
	// sees what they typed without looking back at the canvas.
	const caption = `${ qrCaption ?? '' }`.trim() || DEFAULT_QR_CAPTION;

	return (
		<>
			<div className="jetpack-paypal-payment-buttons__qr-inspector-preview">
				<QrCodePreview
					url={ qrUrl }
					className="jetpack-paypal-button__qr-canvas"
					caption={ qrShowCaption ? caption : '' }
					captionStyle={ getCaptionStyle( attributes ) }
					showDownload
				/>
			</div>

			<CheckboxControl
				label={ __( 'Show text under QR code', 'jetpack-paypal-payments' ) }
				checked={ !! qrShowCaption }
				onChange={ value => setAttributes( { qrShowCaption: value } ) }
				__nextHasNoMarginBottom
			/>

			{ qrShowCaption && (
				<TextControl
					label={ __( 'Caption', 'jetpack-paypal-payments' ) }
					hideLabelFromVision
					value={ qrCaption }
					placeholder={ DEFAULT_QR_CAPTION }
					onChange={ value => setAttributes( { qrCaption: value } ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			) }
		</>
	);
}

/**
 * Colour and size for the QR caption.
 *
 * Only rendered while the caption is on.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @return {Element} The Color and Typography panels.
 */
function QrCaptionPanels( { attributes, setAttributes } ) {
	const { captionColor, captionFontSize } = attributes;

	return (
		<>
			<ToolsPanel
				className="color-block-support-panel"
				label={ __( 'Color', 'jetpack-paypal-payments' ) }
				resetAll={ () => setAttributes( { captionColor: '' } ) }
				hasInnerWrapper
				headingLevel={ 3 }
				__experimentalFirstVisibleItemClass="first"
				__experimentalLastVisibleItemClass="last"
			>
				<ToolsPanelItem
					label={ __( 'Text', 'jetpack-paypal-payments' ) }
					hasValue={ () => !! captionColor }
					onDeselect={ () => setAttributes( { captionColor: '' } ) }
					isShownByDefault
				>
					<div className="color-block-support-panel__inner-wrapper">
						<ColorGradientControl
							label={ __( 'Text', 'jetpack-paypal-payments' ) }
							colorValue={ captionColor }
							onColorChange={ value => setAttributes( { captionColor: value || '' } ) }
							disableCustomGradients
							enableAlpha={ false }
							__experimentalIsRenderedInSidebar
						/>
					</div>
				</ToolsPanelItem>
			</ToolsPanel>

			<ToolsPanel
				label={ __( 'Typography', 'jetpack-paypal-payments' ) }
				resetAll={ () => setAttributes( { captionFontSize: undefined } ) }
				headingLevel={ 3 }
				__experimentalFirstVisibleItemClass="first"
				__experimentalLastVisibleItemClass="last"
			>
				<ToolsPanelItem
					label={ __( 'Size', 'jetpack-paypal-payments' ) }
					hasValue={ () => captionFontSize !== undefined }
					onDeselect={ () => setAttributes( { captionFontSize: undefined } ) }
					isShownByDefault
				>
					<UnitControl
						label={ __( 'Size', 'jetpack-paypal-payments' ) }
						value={ captionFontSize === undefined ? '' : `${ captionFontSize }px` }
						units={ [ { value: 'px', label: 'px' } ] }
						onChange={ value => {
							const parsed = parseFloat( value );
							setAttributes( { captionFontSize: isNaN( parsed ) ? undefined : parsed } );
						} }
						__next40pxDefaultSize
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</>
	);
}

/**
 * The Styles tab.
 *
 * The first `group="styles"` fill is what creates the editor's tab bar, so the
 * product form in the default group becomes the Settings tab at the same time.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.format        - Display format: BUTTON, LINK or QR.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @param {string}   props.qrUrl         - The attributed payment URL to encode.
 * @param {boolean}  props.disabled      - Whether the format switcher is disabled.
 * @return {Element} The Styles tab contents.
 */
export default function PayPalFormatControls( {
	format,
	attributes,
	setAttributes,
	qrUrl,
	disabled,
} ) {
	// Width and Border apply to BUTTON and QR only; LINK has no box to size.
	const hasBox = format !== 'LINK';

	return (
		<InspectorControls group="styles">
			{ /* Embed as and the format's own controls sit in a plain section with
			     a divider, not a collapsible panel. Only Color, Typography, Width
			     and Border are panels. */ }
			<div className="jetpack-paypal-payment-buttons__format-section">
				<FormatSwitcher
					value={ format }
					onChange={ value => setAttributes( { format: value } ) }
					disabled={ disabled }
				/>

				{ 'QR' === format && (
					<QrOutputControls
						attributes={ attributes }
						setAttributes={ setAttributes }
						qrUrl={ qrUrl }
					/>
				) }
			</div>

			{ 'QR' === format && attributes.qrShowCaption && (
				<QrCaptionPanels attributes={ attributes } setAttributes={ setAttributes } />
			) }

			{ hasBox && (
				<>
					<WidthPanel blockWidth={ attributes.blockWidth } setAttributes={ setAttributes } />
					<BorderPanel attributes={ attributes } setAttributes={ setAttributes } />
				</>
			) }
		</InspectorControls>
	);
}
