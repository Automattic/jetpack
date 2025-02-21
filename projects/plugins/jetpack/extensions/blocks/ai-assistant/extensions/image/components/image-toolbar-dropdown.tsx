/*
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { caption as captionIcon, unseen as altTextIcon } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import AiAssistantToolbarDropdown from '../../../extensions/components/ai-assistant-toolbar-dropdown';
/*
 * Types
 */
import type { ReactElement } from 'react';

type AiAssistantExtensionToolbarDropdownContentProps = {
	onClose: () => void;
	onRequestAltText: () => void;
	onRequestCaption: () => void;
};

/**
 * The dropdown content component with logic for the image block extension toolbar.
 * @param {AiAssistantExtensionToolbarDropdownContentProps} props - The props.
 * @return {ReactElement} The React content of the dropdown.
 */
function AiAssistantExtensionToolbarDropdownContent( {
	onClose,
	onRequestAltText,
	onRequestCaption,
}: AiAssistantExtensionToolbarDropdownContentProps ) {
	const handleToolbarButtonClick = useCallback(
		( type: 'alt-text' | 'caption' ) => {
			if ( type === 'alt-text' ) {
				onRequestAltText?.();
			} else {
				onRequestCaption?.();
			}
			onClose?.();
		},
		[ onRequestAltText, onRequestCaption, onClose ]
	);

	const handleRequestAltText = () => {
		handleToolbarButtonClick( 'alt-text' );
	};

	const handleRequestCaption = () => {
		handleToolbarButtonClick( 'caption' );
	};

	return (
		<MenuGroup>
			<MenuItem
				icon={ altTextIcon }
				iconPosition="left"
				key="key-ai-assistant-alt-text"
				onClick={ handleRequestAltText }
			>
				{ __( 'Generate alt text', 'jetpack' ) }
			</MenuItem>
			<MenuItem
				icon={ captionIcon }
				iconPosition="left"
				key="key-ai-assistant-caption"
				onClick={ handleRequestCaption }
			>
				{ __( 'Generate caption', 'jetpack' ) }
			</MenuItem>
		</MenuGroup>
	);
}

export default function AiAssistantImageExtensionToolbarDropdown( {
	label = __( 'AI Assistant', 'jetpack' ),
	onRequestAltText,
	onRequestCaption,
}: {
	label?: string;
	onRequestAltText: () => void;
	onRequestCaption: () => void;
} ): ReactElement {
	const { tracks } = useAnalytics();

	const toggleHandler = useCallback(
		( isOpen: boolean ) => {
			if ( isOpen ) {
				tracks.recordEvent( 'jetpack_ai_assistant_extension_toolbar_menu_show', {
					block_type: 'core/image',
				} );
			}
		},
		[ tracks ]
	);

	const handleRequestAltText = useCallback( () => {
		tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
			suggestion: 'alt-text',
			block_type: 'core/image',
		} );

		onRequestAltText?.();
	}, [ onRequestAltText, tracks ] );

	const handleRequestCaption = useCallback( () => {
		tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
			suggestion: 'caption',
			block_type: 'core/image',
		} );

		onRequestCaption?.();
	}, [ onRequestCaption, tracks ] );

	return (
		<AiAssistantToolbarDropdown
			label={ label }
			behavior={ 'dropdown' }
			onDropdownToggle={ toggleHandler }
			renderContent={ ( { onClose } ) => (
				<AiAssistantExtensionToolbarDropdownContent
					onClose={ onClose }
					onRequestAltText={ handleRequestAltText }
					onRequestCaption={ handleRequestCaption }
				/>
			) }
		/>
	);
}
