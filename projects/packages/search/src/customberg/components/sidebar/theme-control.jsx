import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
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
		<div className="jp-search-configure-theme-buttons components-base-control">
			<Button
				className={ clsx( {
					'jp-search-configure-theme-button--selected': value === 'light',
				} ) }
				disabled={ disabled }
				onClick={ () => onChange( 'light' ) }
				variant="link"
			>
				<ThemeIcon theme="light" />
				<span aria-label={ __( 'Light Theme', 'jetpack-search-pkg' ) }>
					{ __( 'Light', 'jetpack-search-pkg' ) }
				</span>
			</Button>
			<Button
				className={ clsx( {
					'jp-search-configure-theme-button--selected': value === 'dark',
				} ) }
				disabled={ disabled }
				onClick={ () => onChange( 'dark' ) }
				variant="link"
			>
				<ThemeIcon theme="dark" />
				<span aria-label={ __( 'Dark Theme', 'jetpack-search-pkg' ) }>
					{ __( 'Dark', 'jetpack-search-pkg' ) }
				</span>
			</Button>
		</div>
	);
}
