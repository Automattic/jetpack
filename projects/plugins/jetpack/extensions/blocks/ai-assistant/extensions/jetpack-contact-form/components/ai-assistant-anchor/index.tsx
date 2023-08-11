/**
 * External dependencies
 */
import { KeyboardShortcuts } from '@wordpress/components';
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

type AiAssistantAnchorProps = {
	clientId?: string;
};

/**
 * Ai Assistant anchor component.
 *
 * @param {string} clientId  - The block client ID. Optional.
 * @returns {React.Component} AI Assistant anchor component.
 */

const AiAssistantAnchor = ( { clientId = '' }: AiAssistantAnchorProps ): React.ReactNode => {
	const { isVisible, isFixed, toggle } = useContext( AiAssistantUiContext );

	if ( ! isVisible || isFixed ) {
		return null;
	}

	return (
		<div className="jetpack-ai-assistant__anchor">
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			/>

			<AiAssistantBar clientId={ clientId } className="jetpack-ai-assistant__anchor-bar" />
		</div>
	);
};

export default AiAssistantAnchor;
