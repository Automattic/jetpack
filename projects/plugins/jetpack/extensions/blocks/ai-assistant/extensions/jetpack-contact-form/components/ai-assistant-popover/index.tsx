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
	blockListBlockRef?: React.RefObject< HTMLElement >;
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
	clientId = '',
}: AiAssistantPopoverProps ): React.ReactNode => {
	const { isVisible, isFixed, toggle, width } = useContext( AiAssistantUiContext );

	if ( ! isVisible || isFixed ) {
		return null;
	}

	return (
		<Popover
			placement="bottom-start"
			variant={ null }
			offset={ 70 }
			animate={ false }
			className="jetpack-ai-assistant__popover"
		>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			/>

			<div style={ { width } }>
				<AiAssistantBar clientId={ clientId } />
			</div>
		</Popover>
	);
};
