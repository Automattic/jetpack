/**
 * WordPress dependencies
 */
import { Popover, SlotFillProvider } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Interface from './interface';
import { eventPrefix, initialize, identifySite, recordEvent } from '../../lib/analytics';
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

	return (
		<SlotFillProvider>
			<Interface />
			<Sidebar />
			<Popover.Slot />
		</SlotFillProvider>
	);
}
