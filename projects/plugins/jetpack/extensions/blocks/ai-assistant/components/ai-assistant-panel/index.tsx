/**
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { BlockIcon } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { ReactElement } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Block sidebar Pannel
 *
 * @returns {ReactElement} The component's elements.
 */
export default function AiAssistantPanel(): ReactElement {
	return (
		<PanelBody
			title={ __( 'AI Assistant', 'jetpack' ) }
			className="jetpack-ai-assistant__ai-assistant-panel"
			icon={ <BlockIcon icon={ aiAssistantIcon } /> }
		/>
	);
}
