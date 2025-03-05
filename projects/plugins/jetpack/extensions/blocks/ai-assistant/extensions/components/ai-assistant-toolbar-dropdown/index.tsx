/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { ToolbarButton, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/*
 * Types
 */
import type { BlockBehavior } from '../../types';
import type { ReactElement } from 'react';

export default function AiAssistantToolbarDropdown( {
	label = __( 'AI Assistant', 'jetpack' ),
	behavior,
	onAction,
	onDropdownToggle,
	renderContent,
	behaviorContext,
	disabled,
}: {
	label?: string;
	behavior: BlockBehavior;
	onAction?: () => void;
	onDropdownToggle?: ( isOpen: boolean ) => void;
	renderContent: ( { onClose }: { onClose: () => void } ) => ReactElement;
	behaviorContext?: unknown;
	disabled?: boolean;
} ): ReactElement {
	return (
		<Dropdown
			popoverProps={ {
				variant: 'toolbar',
			} }
			renderToggle={ ( { isOpen, onToggle } ) => {
				const handleClick = () => {
					if ( typeof behavior === 'function' ) {
						behavior( { context: behaviorContext } );
						return;
					}

					switch ( behavior ) {
						case 'action':
							onAction?.();
							break;
						case 'dropdown':
							onToggle();
							break;
					}
				};

				return (
					<ToolbarButton
						className="jetpack-ai-assistant__button"
						showTooltip
						onClick={ handleClick }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						icon={ aiAssistantIcon }
						disabled={ disabled }
					/>
				);
			} }
			onToggle={ onDropdownToggle }
			renderContent={ renderContent }
		/>
	);
}
