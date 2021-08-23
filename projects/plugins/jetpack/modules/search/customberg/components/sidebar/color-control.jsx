/**
 * WordPress dependencies
 */
import { __experimentalColorGradientControl as ColorGradientControl } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/* eslint-disable react/jsx-no-bind */

const DEFAULT_COLORS = [
	{ name: 'Dull blue', color: '#463ECE' },
	{ name: 'Jazzberry jam', color: '#C6446F' },
	{ name: 'June bud', color: '#C4D455' },
];

/**
 * Color control for use in SidebarOptions tab.
 *
 * @param {object} props - component properties.
 * @param {boolean} props.disabled - disables the control.
 * @param {Function} props.onChange - invoked with a new color when the selected color has changed.
 * @param {string} props.value - color value prefixed with #.
 * @returns {Element} component instance
 */
export default function ColorControl( { disabled, value, onChange } ) {
	const colors = useSelect( select => {
		const settings = select( 'core/block-editor' ).getSettings() ?? {};
		const { colors } = settings;
		return Array.isArray( colors ) && colors.length > 0 ? colors : DEFAULT_COLORS;
	} );

	return (
		<div className="jp-search-customize-color-input components-base-control">
			<ColorGradientControl
				label={ __( 'Highlight for search terms', 'jetpack' ) }
				disabled={ disabled }
				colorValue={ value }
				colors={ colors }
				disableCustomColors={ false }
				disableCustomGradients={ true }
				onColorChange={ onChange }
			/>
		</div>
	);
}
