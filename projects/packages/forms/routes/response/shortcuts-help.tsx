/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import * as React from 'react';
/**
 * Internal dependencies
 */
import { getShortcutDescriptions } from './use-keyboard-shortcuts.ts';

/**
 * The keyboard shortcut reference for the single response page.
 *
 * Without this the destructive shortcuts (`e`, `!`) are undiscoverable — there is
 * nothing on the page that would lead a user to try them.
 *
 * @param props         - Component props.
 * @param props.onClose - Called when the dialog is dismissed.
 * @return The shortcuts dialog.
 */
export default function ShortcutsHelp( { onClose }: { onClose: () => void } ): React.JSX.Element {
	return (
		<Modal
			title={ __( 'Keyboard shortcuts', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			className="jp-forms__single-response-shortcuts"
		>
			<ul className="jp-forms__single-response-shortcuts__list">
				{ getShortcutDescriptions().map( ( { keys, description } ) => (
					<li key={ description } className="jp-forms__single-response-shortcuts__item">
						<span className="jp-forms__single-response-shortcuts__description">
							{ description }
						</span>
						<span className="jp-forms__single-response-shortcuts__keys">
							{ keys.map( ( key, index ) => (
								<React.Fragment key={ key }>
									{ index > 0 && (
										<span className="jp-forms__single-response-shortcuts__or">
											{ /* Separator between two keys that do the same thing. */ }
											{ __( 'or', 'jetpack-forms' ) }
										</span>
									) }
									<kbd className="jp-forms__single-response-shortcuts__key">{ key }</kbd>
								</React.Fragment>
							) ) }
						</span>
					</li>
				) ) }
			</ul>
		</Modal>
	);
}
