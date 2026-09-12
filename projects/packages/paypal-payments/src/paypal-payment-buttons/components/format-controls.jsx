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
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	__experimentalBorderRadiusControl as BorderRadiusControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalSpacingSizesControl as SpacingSizesControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	BorderControl,
	Button,
	CheckboxControl,
	PanelBody,
	TextControl,
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUnitControl as UnitControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getTextStyle, isOutlineButton } from '../utils/block-styles';
import { DEFAULT_LABEL } from '../utils/defaults';
import FormatSwitcher from './format-switcher';
import QrCodePreview from './qr-code-preview';

// ToolsPanel and the dropdown inside it have to agree on the panel they belong to.
const PANEL_ID = 'paypal-color';

// Hoisted: the production build folds a ternary around __() and then fails the
// i18n check on the result. Only that build does it, so it surfaces in CI.
const COPY_LABEL = __( 'Copy', 'jetpack-paypal-payments' );
const COPIED_LABEL = __( 'Copied!', 'jetpack-paypal-payments' );

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
 * The text field for a format's label — the button face, the link, the QR
 * caption. All three share one default, so they share one control.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.label         - The field's label.
 * @param {boolean}  props.hideLabel     - Whether the label is for screen readers only.
 * @param {string}   props.attribute     - Attribute holding the text.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @param {boolean}  props.disabled      - Whether the field is locked.
 * @return {Element} The text field.
 */
function LabelField( { label, hideLabel, attribute, attributes, setAttributes, disabled } ) {
	return (
		<TextControl
			label={ label }
			hideLabelFromVision={ hideLabel }
			value={ attributes[ attribute ] || '' }
			placeholder={ DEFAULT_LABEL }
			onChange={ value => setAttributes( { [ attribute ]: value } ) }
			disabled={ disabled }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
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
 * @param {boolean}  props.disabled      - Whether the caption controls are locked.
 * @return {Element} The QR preview, Download, and the caption toggle and field.
 */
function QrOutputControls( { attributes, setAttributes, qrUrl, disabled } ) {
	// Absent means off, the way the canvas and render_api_managed_button() read it.
	const { qrShowCaption = false, qrCaption } = attributes;

	return (
		<>
			<div className="jetpack-paypal-payment-buttons__qr-inspector-preview">
				{ /* Caption the inspector's copy too, so the merchant sees what they
				     typed without looking back at the canvas. */ }
				<QrCodePreview
					url={ qrUrl }
					className="jetpack-paypal-button__qr-canvas"
					showCaption={ qrShowCaption }
					caption={ qrCaption }
					captionStyle={ getTextStyle( attributes.captionColor, attributes.captionFontSize ) }
					showDownload
				/>
			</div>

			<CheckboxControl
				label={ __( 'Show text under QR code', 'jetpack-paypal-payments' ) }
				checked={ !! qrShowCaption }
				onChange={ value => setAttributes( { qrShowCaption: value } ) }
				disabled={ disabled }
				__nextHasNoMarginBottom
			/>

			{ qrShowCaption && (
				<LabelField
					label={ __( 'Caption', 'jetpack-paypal-payments' ) }
					hideLabel
					attribute="qrCaption"
					attributes={ attributes }
					setAttributes={ setAttributes }
					disabled={ disabled }
				/>
			) }
		</>
	);
}

/**
 * The Color panel — one swatch row per color, so the button draws Text and
 * Background and the other formats draw one.
 *
 * @param {object}   props               - Component props.
 * @param {Array}    props.rows          - `{ label, colorKey }` per visible swatch row.
 * @param {Array}    [props.ownedKeys]   - Every color key the format owns, visible or not. Defaults to the visible rows.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @param {Element}  props.children      - Rendered under the swatches, for the contrast warning.
 * @return {Element} The Color panel.
 */
function ColorPanel( { rows, ownedKeys, attributes, setAttributes, children } ) {
	const colorSettings = useMultipleOriginColorsAndGradients();
	// Reset All clears every key the format owns, not just the rows on screen —
	// a hidden one would otherwise survive and reappear when it comes back.
	const cleared = Object.fromEntries(
		( ownedKeys ?? rows.map( row => row.colorKey ) ).map( key => [ key, '' ] )
	);

	return (
		/* Same structure as core's ColorToolsPanel: the class, hasInnerWrapper and
		   the inner div go together, or each swatch draws its own tall box.
		   @see @wordpress/block-editor/src/components/global-styles/color-panel.js */
		<ToolsPanel
			className="color-block-support-panel"
			label={ __( 'Color', 'jetpack-paypal-payments' ) }
			resetAll={ () => setAttributes( cleared ) }
			panelId={ PANEL_ID }
			hasInnerWrapper
			headingLevel={ 3 }
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
		>
			<div className="color-block-support-panel__inner-wrapper">
				<ColorGradientSettingsDropdown
					__experimentalIsRenderedInSidebar
					panelId={ PANEL_ID }
					settings={ rows.map( ( { label, colorKey } ) => ( {
						label,
						colorValue: attributes[ colorKey ],
						onColorChange: value => setAttributes( { [ colorKey ]: value || '' } ),
						clearable: true,
					} ) ) }
					{ ...colorSettings }
					gradients={ [] }
					disableCustomGradients
				/>
				{ children }
			</div>
		</ToolsPanel>
	);
}

/**
 * Typography — one custom size.
 *
 * Its own panel rather than part of ColorPanel: the button puts Width Settings
 * between the two, and the other formats do not.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.fontSizeKey   - Attribute holding the font size.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @return {Element} The Typography panel.
 */
function TypographyPanel( { fontSizeKey, attributes, setAttributes } ) {
	return (
		<PanelBody title={ __( 'Typography', 'jetpack-paypal-payments' ) }>
			<FontSizePicker
				value={ attributes[ fontSizeKey ] }
				onChange={ value => setAttributes( { [ fontSizeKey ]: value } ) }
				withReset={ false }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
		</PanelBody>
	);
}

/**
 * Styles — Fill or Outline, on the button only.
 *
 * Not a `registerBlockStyle` variation: core renders `BlockStyles` first in the
 * tab and as preview cards, and the design puts this below Color as two plain
 * buttons.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.buttonStyle   - The chosen style.
 * @param {Function} props.setAttributes - Update block attributes.
 * @return {Element} The Styles panel.
 */
function StylesPanel( { buttonStyle, setAttributes } ) {
	return (
		<PanelBody title={ __( 'Styles', 'jetpack-paypal-payments' ) }>
			<ToggleGroupControl
				label={ __( 'Styles', 'jetpack-paypal-payments' ) }
				hideLabelFromVision
				value={ buttonStyle || 'fill' }
				onChange={ value => setAttributes( { buttonStyle: value } ) }
				isBlock
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			>
				<ToggleGroupControlOption value="fill" label={ __( 'Fill', 'jetpack-paypal-payments' ) } />
				<ToggleGroupControlOption
					value="outline"
					label={ __( 'Outline', 'jetpack-paypal-payments' ) }
				/>
			</ToggleGroupControl>
		</PanelBody>
	);
}

/**
 * The LINK output controls — the label, and the payment URL with a Copy button.
 *
 * LINK is the only format with a URL, so the Copy button lives here.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Update block attributes.
 * @param {string}   props.paymentUrl    - The attributed payment URL.
 * @param {boolean}  props.disabled      - Whether the label field is locked.
 * @return {Element} The link text field and the URL row.
 */
function LinkOutputControls( { attributes, setAttributes, paymentUrl, disabled } ) {
	// Counted rather than a flag: copying again inside the window has to restart
	// the timer, and setting a true flag true again does not re-run the effect.
	const [ copies, setCopies ] = useState( 0 );
	const copyRef = useCopyToClipboard( paymentUrl, () => setCopies( n => n + 1 ) );

	useEffect( () => {
		if ( ! copies ) {
			return;
		}

		const timer = setTimeout( () => setCopies( 0 ), 2000 );
		return () => clearTimeout( timer );
	}, [ copies ] );

	return (
		<>
			<LabelField
				label={ __( 'Link text', 'jetpack-paypal-payments' ) }
				attribute="linkText"
				attributes={ attributes }
				setAttributes={ setAttributes }
				disabled={ disabled }
			/>

			{ /* No URL until the post is saved and the payment exists. */ }
			{ !! paymentUrl && (
				<div className="jetpack-paypal-payment-buttons__link-url">
					<TextControl
						label={ __( 'URL', 'jetpack-paypal-payments' ) }
						value={ paymentUrl }
						readOnly
						disabled={ disabled }
						onFocus={ event => event.target.select() }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
					{ /* Locked with the rest while a request is in flight: the link
					     is being rewritten, so copying it hands out a stale URL. */ }
					<Button ref={ copyRef } variant="secondary" disabled={ disabled } __next40pxDefaultSize>
						{ copies ? COPIED_LABEL : COPY_LABEL }
					</Button>
				</div>
			) }
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
 * @param {string}   props.paymentUrl    - The attributed payment URL — encoded by QR, copied by LINK.
 * @param {boolean}  props.disabled      - Whether the format switcher and the per-format output controls are locked.
 * @return {Element} The Styles tab contents.
 */
export default function PayPalFormatControls( {
	format,
	attributes,
	setAttributes,
	paymentUrl,
	disabled,
} ) {
	const isOutline = isOutlineButton( attributes );

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

				{ 'BUTTON' === format && (
					<>
						<LabelField
							label={ __( 'Button text', 'jetpack-paypal-payments' ) }
							attribute="buttonText"
							attributes={ attributes }
							setAttributes={ setAttributes }
							disabled={ disabled }
						/>

						{ /* TODO: add a `Show payment method logos` checkbox above this one,
						     once legal signs off on the card-network marks. */ }
						<CheckboxControl
							label={ __( 'Show "Powered by PayPal" text', 'jetpack-paypal-payments' ) }
							checked={ !! attributes.buttonShowPoweredBy }
							onChange={ value => setAttributes( { buttonShowPoweredBy: value } ) }
							disabled={ disabled }
							__nextHasNoMarginBottom
						/>
					</>
				) }

				{ 'LINK' === format && (
					<LinkOutputControls
						attributes={ attributes }
						setAttributes={ setAttributes }
						paymentUrl={ paymentUrl }
						disabled={ disabled }
					/>
				) }

				{ 'QR' === format && (
					<QrOutputControls
						attributes={ attributes }
						setAttributes={ setAttributes }
						qrUrl={ paymentUrl }
						disabled={ disabled }
					/>
				) }
			</div>

			{ /* Each format's panels, in render order. */ }
			{ 'BUTTON' === format && (
				<>
					<ColorPanel
						rows={ [
							{ label: __( 'Text', 'jetpack-paypal-payments' ), colorKey: 'buttonTextColor' },
							// Outline renders on the theme's background, so both renderers
							// drop this value — the swatch would set an attribute nothing reads.
							! isOutline && {
								label: __( 'Background', 'jetpack-paypal-payments' ),
								colorKey: 'buttonBackgroundColor',
							},
						].filter( Boolean ) }
						ownedKeys={ [ 'buttonTextColor', 'buttonBackgroundColor' ] }
						attributes={ attributes }
						setAttributes={ setAttributes }
					>
						{ ! isOutline && (
							<ContrastChecker
								textColor={ attributes.buttonTextColor }
								backgroundColor={ attributes.buttonBackgroundColor }
								isLargeText={ false }
							/>
						) }
					</ColorPanel>
					<StylesPanel buttonStyle={ attributes.buttonStyle } setAttributes={ setAttributes } />
					<WidthPanel blockWidth={ attributes.blockWidth } setAttributes={ setAttributes } />
					<TypographyPanel
						fontSizeKey="buttonFontSize"
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<BorderPanel attributes={ attributes } setAttributes={ setAttributes } />
				</>
			) }

			{ /* LINK has no box to size, so no Width or Border. */ }
			{ 'LINK' === format && (
				<>
					<ColorPanel
						rows={ [
							{ label: __( 'Link text', 'jetpack-paypal-payments' ), colorKey: 'linkColor' },
						] }
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
					<TypographyPanel
						fontSizeKey="linkFontSize"
						attributes={ attributes }
						setAttributes={ setAttributes }
					/>
				</>
			) }

			{ 'QR' === format && (
				<>
					{ /* Nothing to color or size until there is a caption. */ }
					{ attributes.qrShowCaption && (
						<>
							<ColorPanel
								rows={ [
									{ label: __( 'Text', 'jetpack-paypal-payments' ), colorKey: 'captionColor' },
								] }
								attributes={ attributes }
								setAttributes={ setAttributes }
							/>
							<TypographyPanel
								fontSizeKey="captionFontSize"
								attributes={ attributes }
								setAttributes={ setAttributes }
							/>
						</>
					) }
					<WidthPanel blockWidth={ attributes.blockWidth } setAttributes={ setAttributes } />
					<BorderPanel attributes={ attributes } setAttributes={ setAttributes } showMargin />
				</>
			) }
		</InspectorControls>
	);
}
