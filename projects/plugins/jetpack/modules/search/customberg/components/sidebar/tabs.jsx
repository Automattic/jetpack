/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { JP_SEARCH_TAB_IDENTIFIER, OPTIONS_TAB_IDENTIFIER } from '../../lib/constants';

/**
 * Sidebar tabs.
 *
 * @param {object} props - Component properties
 * @param {string} props.enabledSidebarName - Currently enabled sidebar name.
 * @param {Function} props.enableSidebar - Enables the sidebar upon invocation.
 * @returns {Element} component instance
 */
export default function Tabs( { enabledSidebarName, enableSidebar } ) {
	return (
		<ul>
			<li>
				<Tab
					enableSidebar={ enableSidebar }
					identifier={ JP_SEARCH_TAB_IDENTIFIER }
					isActive={ enabledSidebarName === JP_SEARCH_TAB_IDENTIFIER }
					label={ __( 'Jetpack Search', 'jetpack' ) }
				/>
			</li>
			<li>
				<Tab
					enableSidebar={ enableSidebar }
					identifier={ OPTIONS_TAB_IDENTIFIER }
					isActive={ enabledSidebarName === OPTIONS_TAB_IDENTIFIER }
					label={ __( 'Options', 'jetpack' ) }
				/>
			</li>
		</ul>
	);
}

/**
 * Sidebar tab.
 *
 * @param {object} props - Component properties
 * @param {Function} props.enableSidebar - Callback to enable a specific sidebar by name
 * @param {string} props.identifier - Identifier.
 * @param {string} props.label - Label.
 * @param {boolean} props.isActive - Whether the tab is active.
 * @returns {Element} component instance
 */
function Tab( { enableSidebar, identifier, label, isActive } ) {
	// translators: %s: sidebar label e.g: "Options".
	const ariaLabel = isActive ? sprintf( __( '%s (selected)', 'jetpack' ), label ) : label;
	return (
		<Button
			// eslint-disable-next-line react/jsx-no-bind
			onClick={ () => enableSidebar( identifier ) }
			className={ classNames( 'jp-search-configure-sidebar__panel-tab', {
				'is-active': isActive,
			} ) }
			aria-label={ ariaLabel }
			data-label={ label }
		>
			{ label }
		</Button>
	);
}
