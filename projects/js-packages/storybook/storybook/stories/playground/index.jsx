/* eslint-disable react/react-in-jsx-scope,jsdoc/no-undefined-types */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	BlockTools,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { registerCoreBlocks } from '@wordpress/block-library';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import '@wordpress/format-library';

import './style.scss';

/**
 * Render our playground component
 *
 * @returns {React.Component} - The App
 */
function App() {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	return (
		<div className="playground">
			<SlotFillProvider>
				<BlockEditorProvider value={ blocks } onInput={ updateBlocks } onChange={ updateBlocks }>
					<div className="playground__sidebar">
						<BlockInspector />
					</div>
					<div className="playground__content">
						<BlockTools>
							<div className="editor-styles-wrapper">
								<BlockEditorKeyboardShortcuts.Register />
								<WritingFlow>
									<ObserveTyping>
										<BlockList />
									</ObserveTyping>
								</WritingFlow>
							</div>
						</BlockTools>
					</div>
					<Popover.Slot />
				</BlockEditorProvider>
			</SlotFillProvider>
		</div>
	);
}

export default {
	title: 'Playground/Block Editor',
};

export const _default = () => {
	return <App />;
};
