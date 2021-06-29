/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { Popover, SlotFillProvider } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import Interface from './interface';
import Sidebar from '../sidebar';
import './styles.scss';

/**
 * Top-level component for the Gutenberg-style Jetpack Search customization interface.
 *
 * @returns {React.Element} component instance
 */
export default function Layout() {
	return (
		<SlotFillProvider>
			<Interface />
			<Sidebar />
			<Popover.Slot />
			<PluginArea />
		</SlotFillProvider>
	);
}
