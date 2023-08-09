/**
 * External dependencies
 */
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import { useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
/*
 * Types
 */
import AiAssistantBar from '../ai-assistant-bar';
import type React from 'react';
import './style.scss';

type AiAssistantPopoverProps = {
	clientId?: string;
	anchor?: HTMLElement | null;
};

/**
 * useAiContext hook to provide access to
 * the AI Assistant data (from context),
 * and to subscribe to the request events (onDone, onSuggestion).
 *
 * @param {string} clientId  - The block client ID. Optional.
 * @returns {React.Component} the AI Assistant data context.
 */

export const AiAssistantPopover = ( {
	anchor = null,
	clientId = '',
}: AiAssistantPopoverProps ): React.ReactNode => {
	const { toggle } = useContext( AiAssistantUiContext );

	if ( ! anchor ) {
		return null;
	}

	return (
		<Popover
			anchor={ anchor }
			variant="toolbar"
			placement="bottom"
			offset={ 0 }
			animate={ false }
			className="jetpack-ai-assistant-bar is-fixed"
		>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			/>

			<div style={ { width: '100%' } }>
				<AiAssistantBar clientId={ clientId } />
			</div>
		</Popover>
	);
};
