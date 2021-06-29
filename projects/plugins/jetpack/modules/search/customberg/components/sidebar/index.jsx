/**
 * External dependencies
 */
import classNames from 'classnames';
import React from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { cog } from '@wordpress/icons';
import { ComplementaryArea, store as interfaceStore } from '@wordpress/interface';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { COMPLEMENTARY_AREA_SCOPE } from '../../lib/constants';
import SidebarDescription from './sidebar-description';
import SidebarOptions from './sidebar-options';
import './styles.scss';

const JP_SEARCH_TAB_IDENTIFIER = 'jetpack-customize-search/info';
const OPTIONS_TAB_IDENTIFIER = 'jetpack-customize-search/options';

/**
 * Sidebar tabs.
 *
 * @param {object} props - Component properties
 * @param {string} props.currentArea - Current area.
 * @returns {React.Element} component instance
 */
function Tabs( { currentArea } ) {
	return (
		<ul>
			<li>
				<Tab
					identifier={ JP_SEARCH_TAB_IDENTIFIER }
					label={ __( 'Jetpack Search', 'jetpack' ) }
					isActive={ currentArea === JP_SEARCH_TAB_IDENTIFIER }
				/>
			</li>
			<li>
				<Tab
					identifier={ OPTIONS_TAB_IDENTIFIER }
					label={ __( 'Options', 'jetpack' ) }
					isActive={ currentArea === OPTIONS_TAB_IDENTIFIER }
				/>
			</li>
		</ul>
	);
}

/**
 * Sidebar tab.
 *
 * @param {object} props - Component properties
 * @param {string} props.identifier - Identifier.
 * @param {string} props.label - Label.
 * @param {boolean} props.isActive - Whether the tab is active.
 * @returns {React.Element} component instance
 */
function Tab( { identifier, label, isActive } ) {
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	// translators: %s: sidebar label e.g: "Options".
	const ariaLabel = isActive ? sprintf( __( '%s (selected)', 'jetpack' ), label ) : label;
	return (
		<Button
			// eslint-disable-next-line react/jsx-no-bind
			onClick={ () => enableComplementaryArea( COMPLEMENTARY_AREA_SCOPE, identifier ) }
			className={ classNames( 'jp-search-customize-sidebar__panel-tab', {
				'is-active': isActive,
			} ) }
			aria-label={ ariaLabel }
			data-label={ label }
		>
			{ label }
		</Button>
	);
}

/**
 * Sidebar implemented via ComplementaryArea component. Renders using the slot/fill paradigm.
 *
 * @returns {React.Element} component instance
 */
export default function Sidebar() {
	const currentArea = useSelect( select => {
		const { getActiveComplementaryArea } = select( interfaceStore );
		return getActiveComplementaryArea( COMPLEMENTARY_AREA_SCOPE )
			? getActiveComplementaryArea( COMPLEMENTARY_AREA_SCOPE )
			: JP_SEARCH_TAB_IDENTIFIER;
	}, [] );

	return (
		<ComplementaryArea
			className="jp-search-customize-sidebar"
			header={ <Tabs currentArea={ currentArea } /> }
			headerClassName="jp-search-customize-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings', 'jetpack' ) }
			closeLabel={ __( 'Close settings', 'jetpack' ) }
			scope={ COMPLEMENTARY_AREA_SCOPE }
			identifier={ currentArea }
			icon={ cog }
			isActiveByDefault
		>
			{ currentArea === JP_SEARCH_TAB_IDENTIFIER && <SidebarDescription /> }
			{ currentArea === OPTIONS_TAB_IDENTIFIER && <SidebarOptions /> }
		</ComplementaryArea>
	);
}
