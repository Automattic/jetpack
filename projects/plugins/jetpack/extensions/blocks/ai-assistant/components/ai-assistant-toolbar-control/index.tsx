/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { ToolbarButton } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../extensions/ai-assistant/ui-context';
import './style.scss';

export default function AiAssistantToobarButton( {
	label = __( 'AI Assistant', 'jetpack' ),
	disabled = false,
	requestingState,
} ) {
	const { isAssistantShown, toggleAssistant } = useContext( AiAssistantUiContext );

	return (
		<ToolbarButton
			className={ classNames( 'jetpack-ai-assistant__button', {
				[ `is-${ requestingState }` ]: true,
			} ) }
			showTooltip
			onClick={ toggleAssistant }
			aria-haspopup="true"
			aria-expanded={ isAssistantShown }
			label={ label }
			icon={ aiAssistantIcon }
			disabled={ disabled }
			isActive={ isAssistantShown }
		/>
	);
}
