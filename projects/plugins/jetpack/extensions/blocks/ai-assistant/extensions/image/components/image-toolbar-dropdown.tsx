/*
 * External dependencies
 */
import { showAiAssistantSection, useAiFeature } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MenuGroup, MenuItem, Spinner } from '@wordpress/components';
import { useCallback, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { caption as captionIcon, unseen as altTextIcon } from '@wordpress/icons';
import debugFactory from 'debug';
/*
 * Internal dependencies
 */
import AiAssistantToolbarDropdown from '../../../extensions/components/ai-assistant-toolbar-dropdown';
import { TYPE_ALT_TEXT, TYPE_CAPTION } from '../../../extensions/types';
import './style.scss';
/*
 * Types
 */
import type { LOADING_STATE } from '../../../extensions/types';
import type { ReactElement } from 'react';

type AiAssistantExtensionToolbarDropdownContentProps = {
	onClose: () => void;
	onRequestAltText: () => Promise< void >;
	onRequestCaption: () => Promise< void >;
	loading?: LOADING_STATE;
};

const debug = debugFactory( 'jetpack-ai:image-extension' );

/**
 * The dropdown content component with logic for the image block extension toolbar.
 * @param {AiAssistantExtensionToolbarDropdownContentProps} props - The props.
 * @return {ReactElement} The React content of the dropdown.
 */
const AiAssistantImageExtensionToolbarDropdownContent = forwardRef(
	(
		{
			onClose,
			onRequestAltText,
			onRequestCaption,
			loading = false,
		}: AiAssistantExtensionToolbarDropdownContentProps,
		ref: React.RefObject< HTMLDivElement >
	) => {
		const { requireUpgrade } = useAiFeature();

		const handleToolbarButtonClick = useCallback(
			async ( type: typeof TYPE_ALT_TEXT | typeof TYPE_CAPTION ) => {
				try {
					if ( type === TYPE_ALT_TEXT ) {
						await onRequestAltText?.();
					} else {
						await onRequestCaption?.();
					}
					onClose?.();
				} catch ( error ) {
					debug( 'Error generating %s', type, error );
				}
			},
			[ onRequestAltText, onRequestCaption, onClose ]
		);

		const handleRequestAltText = () => {
			handleToolbarButtonClick( TYPE_ALT_TEXT );
		};

		const handleRequestCaption = () => {
			handleToolbarButtonClick( TYPE_CAPTION );
		};

		return (
			<div
				className="jetpack-ai-assistant-image-toolbar-dropdown-wrapper"
				tabIndex={ -1 }
				ref={ ref }
			>
				<MenuGroup>
					<MenuItem
						icon={ loading === TYPE_ALT_TEXT ? <Spinner /> : altTextIcon }
						iconPosition="left"
						key="key-ai-assistant-alt-text"
						onClick={ handleRequestAltText }
						disabled={ !! loading || requireUpgrade }
					>
						{ __( 'Generate alt text', 'jetpack' ) }
					</MenuItem>
					<MenuItem
						icon={ loading === TYPE_CAPTION ? <Spinner /> : captionIcon }
						iconPosition="left"
						key="key-ai-assistant-caption"
						onClick={ handleRequestCaption }
						disabled={ !! loading || requireUpgrade }
					>
						{ __( 'Generate caption', 'jetpack' ) }
					</MenuItem>
				</MenuGroup>
			</div>
		);
	}
);

export default function AiAssistantImageExtensionToolbarDropdown( {
	label = __( 'AI Assistant', 'jetpack' ),
	onRequestAltText,
	onRequestCaption,
	loading = false,
	disabled = false,
	wrapperRef,
}: {
	label?: string;
	onRequestAltText: () => Promise< void >;
	onRequestCaption: () => Promise< void >;
	loading?: LOADING_STATE;
	disabled?: boolean;
	wrapperRef: React.RefObject< HTMLDivElement >;
} ): ReactElement {
	const { requireUpgrade } = useAiFeature();
	const { tracks } = useAnalytics();

	const toggleHandler = useCallback(
		( isOpen: boolean ) => {
			if ( isOpen ) {
				tracks.recordEvent( 'jetpack_ai_assistant_extension_toolbar_menu_show', {
					block_type: 'core/image',
				} );

				if ( requireUpgrade ) {
					showAiAssistantSection();
				}
			}
		},
		[ requireUpgrade, tracks ]
	);

	const handleRequestAltText = useCallback( () => {
		tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
			suggestion: 'alt-text',
			block_type: 'core/image',
		} );

		return onRequestAltText?.();
	}, [ onRequestAltText, tracks ] );

	const handleRequestCaption = useCallback( () => {
		tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
			suggestion: 'caption',
			block_type: 'core/image',
		} );

		return onRequestCaption?.();
	}, [ onRequestCaption, tracks ] );

	return (
		<AiAssistantToolbarDropdown
			label={ label }
			behavior={ 'dropdown' }
			onDropdownToggle={ toggleHandler }
			disabled={ disabled }
			renderContent={ ( { onClose } ) => (
				<AiAssistantImageExtensionToolbarDropdownContent
					ref={ wrapperRef }
					onClose={ onClose }
					onRequestAltText={ handleRequestAltText }
					onRequestCaption={ handleRequestCaption }
					loading={ loading }
				/>
			) }
		/>
	);
}
