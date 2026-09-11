/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — the Styles tab.
 *
 * The Styles tab — Embed as and the per-format output controls. The panel set
 * changes per format and, for QR, per the caption toggle, which block supports
 * cannot do: block.json declares them once and they cannot follow a checkbox.
 *
 * Modelled on projects/plugins/jetpack/extensions/blocks/donations/style-controls.jsx:
 * one `group="styles"` fill holding core's own controls. Color is core's color
 * dropdown, which carries its reset menu; the rest are collapsible panels.
 *
 * @package
 */

import {
	FontSizePicker,
	InspectorControls,
	__experimentalBorderRadiusControl as BorderRadiusControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalSpacingSizesControl as SpacingSizesControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	BorderControl,
	CheckboxControl,
	PanelBody,
	TextControl,
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUnitControl as UnitControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getCaptionStyle } from '../utils/block-styles';
import { DEFAULT_LABEL } from '../utils/defaults';
import FormatSwitcher from './format-switcher';
import QrCodePreview from './qr-code-preview';

// ToolsPanel and the dropdown inside it have to agree on the panel they belong to.
const PANEL_ID = 'paypal-caption-color';

/**
 * Drop empty branches so they are not persisted into the post content.
 *
 * @param {*} value - A style object, or a leaf.
 * @return {*} The value, or undefined when nothing is left.
 */
function prune( value ) {
	if ( ! value || typeof value !== 'object' ) {
		return value === '' ? undefined : value;
	}

	const kept = Object.entries( value ).reduce( ( out, [ key, child ] ) => {
		const pruned = prune( child );
		return pruned === undefined ? out : { ...out, [ key ]: pruned };
	}, {} );

	return Object.keys( kept ).length ? kept : undefined;
}

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
	// isDeselectable is what makes clicking the selected preset clear it; without
	// it ToggleGroupControl is a radio group and never fires for the active option.
	const selectPreset = value => setAttributes( { blockWidth: value ?? '' } );

	return (
		<PanelBody title={ __( 'Width Settings', 'jetpack-paypal-payments' ) }>
			<div className="jetpack-paypal-payment-buttons__width-controls">
				<ToggleGroupControl
					label={ __( 'Width', 'jetpack-paypal-payments' ) }
					hideLabelFromVision
					value={ blockWidth }
					onChange={ selectPreset }
					isBlock
					isDeselectable
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
		</PanelBody>
	);
}

/**
 * Border Settings — radius and stroke, plus margin on the QR only.
 *
 * All three are core controls, so margin snaps to the theme's spacing scale.
 * Core splits them across Dimensions and Border, which is why the panel is ours
 * and the controls are not.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @param {boolean}  props.showMargin    - Whether this format's panel carries margin.
 * @return {Element} The Border Settings panel.
 */
function BorderPanel( { attributes, setAttributes, showMargin } ) {
	const { colors } = useMultipleOriginColorsAndGradients();
	const style = attributes.style || {};
	const margin = style.spacing?.margin;
	const border = style.border || {};

	// Merge into attributes.style rather than replacing it, so the panels do not
	// clobber each other. Empty sub-objects are dropped rather than persisted as
	// husks in the post content.
	const setStyle = next => {
		const merged = { ...style };

		if ( next.spacing ) {
			merged.spacing = { ...style.spacing, ...next.spacing };
		}
		if ( next.border ) {
			merged.border = { ...border, ...next.border };
		}

		setAttributes( { style: prune( merged ) } );
	};

	return (
		<PanelBody title={ __( 'Border Settings', 'jetpack-paypal-payments' ) }>
			{ showMargin && (
				<SpacingSizesControl
					label={ __( 'Margin', 'jetpack-paypal-payments' ) }
					values={ margin }
					onChange={ value => setStyle( { spacing: { margin: value } } ) }
					sides={ [ 'vertical', 'horizontal' ] }
				/>
			) }

			<BorderRadiusControl
				values={ border.radius }
				onChange={ value => setStyle( { border: { radius: value } } ) }
			/>

			<BorderControl
				label={ __( 'Stroke', 'jetpack-paypal-payments' ) }
				colors={ colors }
				value={ { color: border.color, style: border.style, width: border.width } }
				onChange={ value =>
					setStyle( {
						border: { color: value?.color, style: value?.style, width: value?.width },
					} )
				}
				withSlider
				enableAlpha={ false }
				__next40pxDefaultSize
			/>
		</PanelBody>
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
	// The inspector's copy carries the caption too, the way Create 188 draws it,
	// so the merchant sees what they typed without looking back at the canvas.
	const caption = `${ qrCaption ?? '' }`.trim() || DEFAULT_LABEL;

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
					placeholder={ DEFAULT_LABEL }
					onChange={ value => setAttributes( { qrCaption: value } ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			) }
		</>
	);
}

/**
 * Color and size for the QR caption.
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
	const colorSettings = useMultipleOriginColorsAndGradients();

	return (
		<>
			{ /* ColorGradientSettingsDropdown renders a ToolsPanelItem, so it needs a
			     ToolsPanel around it — which is also what gives Color the reset menu
			     the frame draws. Core's own class names carry its row spacing. */ }
			<ToolsPanel
				className="color-block-support-panel"
				label={ __( 'Color', 'jetpack-paypal-payments' ) }
				resetAll={ () => setAttributes( { captionColor: '' } ) }
				panelId={ PANEL_ID }
				hasInnerWrapper
				headingLevel={ 3 }
				__experimentalFirstVisibleItemClass="first"
				__experimentalLastVisibleItemClass="last"
			>
				<ColorGradientSettingsDropdown
					__experimentalIsRenderedInSidebar
					panelId={ PANEL_ID }
					settings={ [
						{
							label: __( 'Text', 'jetpack-paypal-payments' ),
							colorValue: captionColor,
							onColorChange: value => setAttributes( { captionColor: value || '' } ),
							clearable: true,
							resetAllFilter: () => ( { captionColor: '' } ),
						},
					] }
					{ ...colorSettings }
					gradients={ [] }
					disableCustomGradients
				/>
			</ToolsPanel>

			<PanelBody title={ __( 'Typography', 'jetpack-paypal-payments' ) }>
				<FontSizePicker
					value={ captionFontSize }
					onChange={ value => setAttributes( { captionFontSize: value } ) }
					withReset={ false }
				/>
			</PanelBody>
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
					<BorderPanel
						attributes={ attributes }
						setAttributes={ setAttributes }
						showMargin={ 'QR' === format }
					/>
				</>
			) }
		</InspectorControls>
	);
}
