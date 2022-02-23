/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, image } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SaveButton from 'components/save-button';
import { JP_SEARCH_TAB_IDENTIFIER, OPTIONS_TAB_IDENTIFIER } from 'lib/constants';
import SidebarDescription from './sidebar-description';
import SidebarOptions from './sidebar-options';
import Tabs from './tabs';
import './styles.scss';

/**
 * Sidebar implemented via ComplementaryArea component. Renders using the slot/fill paradigm.
 *
 * @param {object} props - component properties.
 * @returns {Element} component instance
 */
export default function Sidebar( props ) {
	const { enabledSidebarName, enableSidebar, disableSidebar } = props;

	return (
		<div className="interface-complementary-area jp-search-configure-sidebar">
			<div
				className="components-panel__header interface-complementary-area-header jp-search-configure-sidebar__panel-tabs"
				tabindex="-1"
			>
				<Tabs enabledSidebarName={ enabledSidebarName } enableSidebar={ enableSidebar } />
				<SaveButton />
				<Button
					aria-label={ __( 'Show preview', 'jetpack-search-pkg' ) }
					className="jp-search-configure-sidebar__hide-settings-button"
					isSecondary
					onClick={ disableSidebar }
				>
					<Icon icon={ image } />
				</Button>
			</div>
			<div className="components-panel">
				{ enabledSidebarName === JP_SEARCH_TAB_IDENTIFIER && <SidebarDescription /> }
				{ enabledSidebarName === OPTIONS_TAB_IDENTIFIER && <SidebarOptions /> }
			</div>
		</div>
	);
}
