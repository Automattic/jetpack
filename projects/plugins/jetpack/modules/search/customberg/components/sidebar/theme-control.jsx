/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ThemeIcon from './theme-icon';

/* eslint-disable react/jsx-no-bind */

/**
 * Theme control for use in SidebarOptions tab.
 *
 * @param {object} props - component properties.
 * @param {boolean} props.disabled - disables the control.
 * @param {Function} props.onChange - invoked with new theme value when a button is pressed.
 * @param {string} props.value - 'dark' or 'light'.
 * @returns {Element} component instance
 */
export default function ThemeControl( { disabled, value, onChange } ) {
	return (
		<div className="jp-search-customize-theme-buttons components-base-control">
			<Button
				className={ classNames( {
					'jp-search-customize-theme-button--selected': value === 'light',
				} ) }
				disabled={ disabled }
				onClick={ () => onChange( 'light' ) }
				variant="link"
			>
				<ThemeIcon theme="light" />
				<span aria-label={ __( 'Light Theme', 'jetpack' ) }>{ __( 'Light', 'jetpack' ) }</span>
			</Button>
			<Button
				className={ classNames( {
					'jp-search-customize-theme-button--selected': value === 'dark',
				} ) }
				disabled={ disabled }
				onClick={ () => onChange( 'dark' ) }
				variant="link"
			>
				<ThemeIcon theme="dark" />
				<span aria-label={ __( 'Dark Theme', 'jetpack' ) }>{ __( 'Dark', 'jetpack' ) }</span>
			</Button>
		</div>
	);
}
