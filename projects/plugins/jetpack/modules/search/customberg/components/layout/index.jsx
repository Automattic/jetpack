/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Interface from './interface';
import { eventPrefix, initialize, identifySite, recordEvent } from '../../lib/analytics';
import { JP_SEARCH_TAB_IDENTIFIER, OPTIONS_TAB_IDENTIFIER } from '../../lib/constants';
import Sidebar from '../sidebar';
import { SERVER_OBJECT_NAME } from '../../../instant-search/lib/constants';
import './styles.scss';

/**
 * Top-level component for the Gutenberg-style Jetpack Search customization interface.
 *
 * @returns {Element} component instance
 */
export default function Layout() {
	useEffect( () => {
		initialize();
		identifySite( window[ SERVER_OBJECT_NAME ].siteId );
		recordEvent( `${ eventPrefix }_page_view` );
	}, [] );

	const [ enabledSidebarName, setSidebarName ] = useState( OPTIONS_TAB_IDENTIFIER );
	const disableSidebar = () => setSidebarName( null );
	const enableSidebar = ( name = OPTIONS_TAB_IDENTIFIER ) => setSidebarName( name );
	const toggleSidebar = () => ( enabledSidebarName ? disableSidebar() : enableSidebar() );

	return (
		<div className="jp-search-configure-root">
			<Interface
				disableSidebar={ disableSidebar }
				enabledSidebarName={ enabledSidebarName }
				enableSidebar={ enableSidebar }
				toggleSidebar={ toggleSidebar }
			/>
		</div>
	);
}
