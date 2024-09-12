/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { ToolbarButton } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/*
 * Types
 */
import type { ReactElement } from 'react';

/**
 * The toolbar button that toggles the Logo Generator Modal.
 *
 * @param {object}   props              - The component props.
 * @param {Function} props.clickHandler - The handler for the click event.
 * @return {ReactElement} The toolbar button.
 */
export default function AiToolbarButton( {
	clickHandler,
}: {
	clickHandler?: () => void;
} ): ReactElement {
	const toggleFromToolbar = useCallback( () => {
		clickHandler?.();
	}, [ clickHandler ] );

	return (
		<>
			<ToolbarButton
				showTooltip
				onClick={ toggleFromToolbar }
				label={ __( 'Generate with AI', 'jetpack' ) }
				icon={ aiAssistantIcon }
			/>
		</>
	);
}
