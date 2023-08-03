/**
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { BlockIcon } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Block sidebar Pannel
 *
 * @returns {React.ReactElement} The component's elements.
 */
export default function AiAssistantPanel(): React.ReactElement {
	return (
		<PanelBody
			title={ __( 'AI Assistant', 'jetpack' ) }
			className="jetpack-ai-assistant__ai-assistant-panel"
			icon={ <BlockIcon icon={ aiAssistantIcon } /> }
		/>
	);
}
