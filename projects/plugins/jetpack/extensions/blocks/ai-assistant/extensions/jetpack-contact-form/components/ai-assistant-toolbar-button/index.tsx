/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
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

	return (
		<ToolbarButton
			showTooltip
			onClick={ toggle }
			aria-haspopup="true"
			aria-expanded={ true }
			label={ __( 'AI Assistant', 'jetpack' ) }
			icon={ aiAssistantIcon }
			disabled={ false }
			isActive={ isVisible }
		/>
	);
}
