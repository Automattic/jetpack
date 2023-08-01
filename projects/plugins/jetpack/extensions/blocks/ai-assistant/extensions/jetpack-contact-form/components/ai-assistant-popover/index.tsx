/**
 * External dependencies
 */
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import { useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
import './style.scss';

export const AiAssistantPopover = () => {
	const { toggle, isVisible } = useContext( AiAssistantUiContext );

	if ( ! isVisible ) {
		return null;
	}

	return (
		<Popover className="jetpack-ai-assistant__popover">
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			>
				[ AI Client Component here ]
			</KeyboardShortcuts>
		</Popover>
	);
};
