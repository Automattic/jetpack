/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as viewportStore } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from 'instant-search/lib/constants';
import { eventPrefix, initialize, identifySite, recordEvent } from 'lib/analytics';
import { OPTIONS_TAB_IDENTIFIER } from 'lib/constants';
import Interface from './interface';
import './styles.scss';

/**
 * Top-level component for the Gutenberg-style Jetpack Search customization interface.
 *
 * @returns {Element} component instance
 */
export default function Layout() {
	const { isLargeViewport } = useSelect( select => ( {
		isLargeViewport: select( viewportStore ).isViewportMatch( 'large' ),
	} ) );

	const [ enabledSidebarName, setSidebarName ] = useState( OPTIONS_TAB_IDENTIFIER );
	const disableSidebar = () => setSidebarName( null );
	const enableSidebar = ( name = OPTIONS_TAB_IDENTIFIER ) => setSidebarName( name );

	useEffect( () => {
		initialize();
		identifySite( window[ SERVER_OBJECT_NAME ].siteId );
		recordEvent( `${ eventPrefix }_page_view` );
	}, [] );

	// Restores sidebar when at a large viewport.
	useEffect( () => {
		isLargeViewport && enabledSidebarName === null && enableSidebar();
	}, [ enabledSidebarName, isLargeViewport ] );

	return (
		<div className="jp-search-configure-root">
			<Interface
				disableSidebar={ disableSidebar }
				enabledSidebarName={ enabledSidebarName }
				enableSidebar={ enableSidebar }
			/>
		</div>
	);
}
