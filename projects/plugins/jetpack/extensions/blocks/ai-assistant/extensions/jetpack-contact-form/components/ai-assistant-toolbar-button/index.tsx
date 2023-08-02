/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { ToolbarButton } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';

export default function AiAssistantToolbarButton(): React.ReactElement {
	const { isVisible, toggle } = useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

	const isDisabled = requestingState === 'requesting' || requestingState === 'suggesting';

	return (
		<ToolbarButton
			showTooltip
			onClick={ toggle }
			aria-haspopup="true"
			aria-expanded={ isVisible }
			label={ __( 'Ask AI Assistant', 'jetpack' ) }
			icon={ aiAssistantIcon }
			disabled={ isDisabled }
			isActive={ isVisible }
		/>
	);
}
