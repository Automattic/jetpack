/*
 * External dependencies
 */
import { askQuestionSync, usePostContent, openBlockSidebar } from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import debugFactory from 'debug';
/*
 * Internal dependencies
 */
import useBlockModuleStatus from '../../hooks/use-block-module-status';
import { getFeatureAvailability } from '../../lib/utils/get-feature-availability';
import { canAIAssistantBeEnabled } from '../lib/can-ai-assistant-be-enabled';
import { TYPE_ALT_TEXT, TYPE_CAPTION } from '../types';
import AiAssistantImageExtensionToolbarDropdown from './components/image-toolbar-dropdown';
/*
 * Types
 */
import type { LOADING_STATE } from '../types';

const debug = debugFactory( 'jetpack-ai:image-extension' );

export const AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME = 'ai-assistant-image-extension';

// Check if the AI Assistant support is enabled.
export const isAiAssistantImageExtensionEnabled = getFeatureAvailability(
	AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME
);

// Defines where the block controls should be placed in the toolbar
const blockControlsProps = {
	group: 'block' as const,
};

/**
 * Check if it is possible to extend an image block with AI Assistant capabilities.
 * @param {string} blockName - The block name.
 * @return {boolean}           Whether it is possible to extend the block.
 */
export function isPossibleToExtendImageBlock( blockName: string ): boolean {
	const canEnableAIAssistant = canAIAssistantBeEnabled();

	// Do not extend the block if AI Assistant cannot be enabled.
	if ( ! canEnableAIAssistant ) {
		return false;
	}

	// Do not extend the block if the AI Assistant image extension is not enabled.
	if ( ! isAiAssistantImageExtensionEnabled ) {
		return false;
	}

	// Only extend the image block
	if ( blockName !== 'core/image' ) {
		return false;
	}

	return true;
}

// HOC to populate the block's edit component with the AI Assistant toolbar button.
const blockEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	function ExtendedBlock( props ) {
		const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
		const { getPostContent } = usePostContent();
		const [ loading, setLoading ] = useState< LOADING_STATE >( false );
		const { updateBlockAttributes } = useDispatch( editorStore );
		const wrapperRef = useRef< HTMLDivElement >( null );

		// When the dropdown is open, we need to focus the wrapper element to prevent it from closing.
		const startLoading = useCallback( ( type: LOADING_STATE ) => {
			if ( wrapperRef.current ) {
				wrapperRef.current.setAttribute( 'tabindex', '0' );
				wrapperRef.current.focus();
			}

			setLoading( type );
		}, [] );

		useEffect( () => {
			if ( loading === false ) {
				if ( wrapperRef.current ) {
					wrapperRef.current.setAttribute( 'tabindex', '-1' );
				}
			}
		}, [ loading ] );

		const request = useCallback(
			async ( type: typeof TYPE_ALT_TEXT | typeof TYPE_CAPTION ) => {
				startLoading( type );

				try {
					openBlockSidebar( props.clientId );

					const response = await askQuestionSync(
						[
							{
								role: 'jetpack-ai' as const,
								context: {
									type: type,
									content: getPostContent(),
									images: [
										{
											url: props.attributes.url,
										},
									],
								},
							},
						],
						{
							postId,
							feature: 'jetpack-seo-assistant',
						}
					);

					const parsedResponse: { texts?: string[]; captions?: string[] } = JSON.parse( response );

					if ( type === TYPE_ALT_TEXT ) {
						const alt = parsedResponse.texts?.[ 0 ];
						updateBlockAttributes( props.clientId, { alt } );
					} else if ( type === TYPE_CAPTION ) {
						const caption = parsedResponse.captions?.[ 0 ];
						updateBlockAttributes( props.clientId, { caption } );
					}
				} catch ( error ) {
					debug( `Error generating ${ type }`, error );
				} finally {
					setLoading( false );
				}
			},
			[
				getPostContent,
				postId,
				props.attributes.url,
				props.clientId,
				startLoading,
				updateBlockAttributes,
			]
		);

		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls { ...blockControlsProps }>
					<AiAssistantImageExtensionToolbarDropdown
						onRequestAltText={ () => request( TYPE_ALT_TEXT ) }
						onRequestCaption={ () => request( TYPE_CAPTION ) }
						loading={ loading }
						wrapperRef={ wrapperRef }
					/>
				</BlockControls>
			</>
		);
	}

	return props => {
		const isRequiredModulePresent = useBlockModuleStatus( props.name );

		// If the required module is not enabled, return the original block edit component early.
		if ( ! isRequiredModulePresent ) {
			return <BlockEdit { ...props } />;
		}

		return <ExtendedBlock { ...props } />;
	};
}, 'blockEditWithAiComponents' );

/**
 * Function used to extend the registerBlockType settings.
 * Populates the block edit component with the AI Assistant bar and button.
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @return {object}          The extended block settings.
 */
function blockWithInlineExtension( settings, name: string ) {
	// Only extend the allowed block types and when AI is enabled
	const possibleToExtendBlock = isPossibleToExtendImageBlock( name );

	if ( ! possibleToExtendBlock ) {
		return settings;
	}

	return {
		...settings,
		edit: blockEditWithAiComponents( settings.edit ),
		supports: {
			...settings.supports,
			'jetpack/ai': {
				assistant: true,
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/ai-assistant-support/with-ai-image-extension',
	blockWithInlineExtension,
	100
);
