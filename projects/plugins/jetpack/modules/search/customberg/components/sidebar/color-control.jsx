/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { ColorIndicator, ColorPalette } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/* eslint-disable react/jsx-no-bind */

const DEFAULT_COLORS = [
	{ name: 'dull blue', color: '#463ECE' },
	{ name: 'jazzberry jam', color: '#C6446F' },
	{ name: 'june bud', color: '#C4D455' },
];

/**
 * Color control for use in SidebarOptions tab.
 *
 * @param {object} props - component properties.
 * @param {boolean} props.disabled - disables the control.
 * @param {Function} props.onChange - invoked with a new color when the selected color has changed.
 * @param {string} props.value - color value prefixed with #.
 * @returns {React.Element} component instance
 */
export default function ColorControl( { disabled, value, onChange } ) {
	return (
		<div className="jp-search-customize-color-input">
			<div className="jp-search-customize-color-input-label">
				<label htmlFor="jp-search-customize-highlight-color" title={ value }>
					{ __( 'Highlight for search terms', 'jetpack' ) }
				</label>{ ' ' }
				<ColorIndicator colorValue={ value } />
			</div>
			<ColorPalette
				clearable={ false }
				colors={ DEFAULT_COLORS }
				disabled={ disabled }
				value={ value }
				onChange={ onChange }
			/>
		</div>
	);
}
