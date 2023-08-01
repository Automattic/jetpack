/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';

export default function AiAssistantToolbarButton(): React.ReactElement {
	const onToggle = () => console.log( 'toggle!' ); // eslint-disable-line no-console

	return (
		<ToolbarButton
			showTooltip
			onClick={ onToggle }
			aria-haspopup="true"
			aria-expanded={ true }
			label={ __( 'AI Assistant', 'jetpack' ) }
			icon={ aiAssistantIcon }
			disabled={ false }
			isActive={ false }
		/>
	);
}
