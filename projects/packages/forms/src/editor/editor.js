/**
 * WordPress dependencies
 */
import { Popover, SlotFillProvider } from '@wordpress/components';
import { StrictMode } from '@wordpress/element';
import { FullscreenMode, InterfaceSkeleton } from '@wordpress/interface';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import BlockEditor from './components/block-editor';
import Header from './components/header';
import Notices from './components/notices';
import Sidebar from './components/sidebar';

/**
 *
 * @param root0
 * @param root0.settings
 */
function Editor( { settings } ) {
	return (
		<>
			<StrictMode>
				<ShortcutProvider>
					<FullscreenMode isActive={ false } />
					<SlotFillProvider>
						<InterfaceSkeleton
							header={ <Header /> }
							sidebar={ <Sidebar /> }
							content={
								<>
									<Notices />
									<BlockEditor settings={ settings } />
								</>
							}
						/>

						<Popover.Slot />
					</SlotFillProvider>
				</ShortcutProvider>
			</StrictMode>
		</>
	);
}

export default Editor;
