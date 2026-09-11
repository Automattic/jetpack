/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — the Styles tab.
 *
 * EMBED AS and everything under it. The panel set changes per format and, for
 * QR, per the caption toggle — which is why these are our own panels rather
 * than block supports: a supports list in block.json is static per block type
 * and cannot grow a panel when a checkbox flips.
 *
 * Built the way extensions/blocks/donations/style-controls.jsx builds its own:
 * one `group="styles"` fill, core's controls inside ToolsPanels of ours,
 * borrowing core's colour classes so the rows get its spacing and reset.
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
	Flex,
	FlexItem,
	RangeControl,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUnitControl as UnitControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { DEFAULT_QR_CAPTION } from '../utils/defaults';
import FormatSwitcher from './format-switcher';
import QrCodePreview from './qr-code-preview';

/**
 * Width Settings — the frame's 25/50/75/100 presets plus a free percentage.
 *
 * Core has no matching control: core/button's width ToggleGroupControl has the
 * presets but no custom field.
 *
 * @param {object}   props               - Component props.
 * @param {number}   props.blockWidth    - Current width, as a percentage.
 * @param {Function} props.setAttributes - Update block attributes.
 * @return {Element} The Width Settings panel.
 */
function WidthPanel( { blockWidth, setAttributes } ) {
	return (
		<ToolsPanel
			label={ __( 'Width Settings', 'jetpack-paypal-payments' ) }
			resetAll={ () => setAttributes( { blockWidth: undefined } ) }
			headingLevel={ 3 }
		>
			<ToolsPanelItem
				label={ __( 'Width', 'jetpack-paypal-payments' ) }
				hasValue={ () => blockWidth !== undefined }
				onDeselect={ () => setAttributes( { blockWidth: undefined } ) }
				isShownByDefault
			>
				<Flex align="flex-end" gap={ 2 }>
					<FlexItem isBlock>
						<ToggleGroupControl
							label={ __( 'Width', 'jetpack-paypal-payments' ) }
							hideLabelFromVision
							value={ blockWidth }
							onChange={ value => setAttributes( { blockWidth: value } ) }
							isBlock
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						>
							{ [ 25, 50, 75, 100 ].map( preset => (
								<ToggleGroupControlOption
									key={ preset }
									value={ preset }
									label={ `${ preset }%` }
								/>
							) ) }
						</ToggleGroupControl>
					</FlexItem>
					<FlexItem>
						<UnitControl
							label={ __( 'Custom width', 'jetpack-paypal-payments' ) }
							hideLabelFromVision
							value={ blockWidth === undefined ? '' : `${ blockWidth }%` }
							units={ [ { value: '%', label: '%', default: 100 } ] }
							onChange={ value => {
								const parsed = parseFloat( value );
								setAttributes( { blockWidth: isNaN( parsed ) ? undefined : parsed } );
							} }
							__next40pxDefaultSize
						/>
					</FlexItem>
				</Flex>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

/**
 * Border Settings — MARGIN, RADIUS and STROKE, one box.
 *
 * The frame groups margin with border, which core has no panel for: core puts
 * margin in Dimensions and radius in Border.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @return {Element} The Border Settings panel.
 */
function BorderPanel( { attributes, setAttributes } ) {
	const { marginVertical, marginHorizontal, borderRadius, borderWidth, borderColor } = attributes;
	const hasMargin = marginVertical !== undefined || marginHorizontal !== undefined;

	return (
		<ToolsPanel
			label={ __( 'Border Settings', 'jetpack-paypal-payments' ) }
			resetAll={ () =>
				setAttributes( {
					marginVertical: undefined,
					marginHorizontal: undefined,
					borderRadius: undefined,
					borderWidth: undefined,
					borderColor: '',
				} )
			}
			headingLevel={ 3 }
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
				hasValue={ () => borderRadius !== undefined }
				onDeselect={ () => setAttributes( { borderRadius: undefined } ) }
				isShownByDefault
			>
				<RangeControl
					label={ __( 'Radius', 'jetpack-paypal-payments' ) }
					value={ borderRadius }
					onChange={ value => setAttributes( { borderRadius: value } ) }
					min={ 0 }
					max={ 50 }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</ToolsPanelItem>

			<ToolsPanelItem
				label={ __( 'Stroke', 'jetpack-paypal-payments' ) }
				hasValue={ () => borderWidth !== undefined || !! borderColor }
				onDeselect={ () => setAttributes( { borderWidth: undefined, borderColor: '' } ) }
				isShownByDefault
			>
				<RangeControl
					label={ __( 'Stroke', 'jetpack-paypal-payments' ) }
					value={ borderWidth }
					onChange={ value => setAttributes( { borderWidth: value } ) }
					min={ 0 }
					max={ 20 }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<ColorGradientControl
					label={ __( 'Stroke color', 'jetpack-paypal-payments' ) }
					colorValue={ borderColor }
					onColorChange={ value => setAttributes( { borderColor: value || '' } ) }
					disableCustomGradients
					enableAlpha={ false }
					__experimentalIsRenderedInSidebar
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

/**
 * The QR output section — Create 186 and 188, above the first divider.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @param {string}   props.qrUrl         - The attributed payment URL to encode.
 * @return {Element} The QR preview, Download, and the caption toggle and field.
 */
function QrOutputControls( { attributes, setAttributes, qrUrl } ) {
	const { qrShowCaption, qrCaption } = attributes;

	return (
		<>
			<div className="jetpack-paypal-payment-buttons__qr-inspector-preview">
				<QrCodePreview url={ qrUrl } className="jetpack-paypal-button__qr-canvas" showDownload />
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
 * These exist only while the caption does, which is what captures 12 and 17
 * draw: the same frame, checkbox off then on. A block support could not do
 * this — it is declared once in block.json and cannot follow a checkbox.
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
						units={ [ { value: 'px', label: 'px', default: 16 } ] }
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
	// Width and Border are BUTTON and QR only — Create 187 draws neither for LINK.
	const hasBox = format !== 'LINK';

	return (
		<InspectorControls group="styles">
			{ /* EMBED AS and the format's own output controls sit in a plain
			     section — the frames give them a label and a divider, not a
			     collapsible panel header. Only Color, Typography, Width and
			     Border are panels. */ }
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
