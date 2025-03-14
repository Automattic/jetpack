/*
 * External dependencies
 */
import {
	askQuestionSync,
	usePostContent,
	openBlockSidebar,
	useAiFeature,
	getBase64Image,
} from '@automattic/jetpack-ai-client';
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
import { store as seoStore } from '../../../../plugins/ai-assistant-plugin/components/seo-enhancer/store';
import useBlockModuleStatus from '../../hooks/use-block-module-status';
import { getFeatureAvailability } from '../../lib/utils/get-feature-availability';
import { canAIAssistantBeEnabled } from '../lib/can-ai-assistant-be-enabled';
import { preprocessImageContent } from '../lib/preprocess-image-content';
import { TYPE_ALT_TEXT, TYPE_CAPTION } from '../types';
import AiAssistantImageExtensionToolbarDropdown from './components/image-toolbar-dropdown';

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
		const { increaseRequestsCount, dequeueAsyncRequest, requireUpgrade } = useAiFeature();
		const { getCurrentPostId, isImageBusy } = useSelect(
			select => {
				const { getCurrentPostId: getPostId } = select( editorStore ) as {
					getCurrentPostId: () => number;
				};
				const isBusy = select( seoStore )?.isImageBusy( props.clientId ) ?? false;

				return { getCurrentPostId: getPostId, isImageBusy: isBusy };
			},
			[ props.clientId ]
		);
		const { getPostContent } = usePostContent();
		const [ loadingAltText, setLoadingAltText ] = useState< boolean >( isImageBusy );
		const [ loadingCaption, setLoadingCaption ] = useState< boolean >( false );
		const { updateBlockAttributes } = useDispatch( editorStore );
		const { createNotice } = useDispatch( 'core/notices' );
		const wrapperRef = useRef< HTMLDivElement >( null );
		const hasImage = !! props.attributes.url;
		const loading = loadingAltText || loadingCaption;

		useEffect( () => {
			setLoadingAltText( isImageBusy );
		}, [ isImageBusy ] );

		const setLoading = ( type: typeof TYPE_ALT_TEXT | typeof TYPE_CAPTION, value: boolean ) => {
			if ( type === TYPE_ALT_TEXT ) {
				setLoadingAltText( value );
			} else if ( type === TYPE_CAPTION ) {
				setLoadingCaption( value );
			}
		};

		// When the dropdown is open, we need to focus the wrapper element to prevent it from closing.
		const startLoading = useCallback( ( type: typeof TYPE_ALT_TEXT | typeof TYPE_CAPTION ) => {
			if ( wrapperRef.current ) {
				wrapperRef.current.setAttribute( 'tabindex', '0' );
				wrapperRef.current.focus();
			}

			setLoading( type, true );
		}, [] );

		const showErrorNotice = useCallback(
			( message: string ) => {
				createNotice( 'error', message, {
					isDismissible: true,
				} );
			},
			[ createNotice ]
		);

		useEffect( () => {
			if ( ! loading ) {
				if ( wrapperRef.current ) {
					wrapperRef.current.setAttribute( 'tabindex', '-1' );
				}
			}
		}, [ loading ] );

		const request = useCallback(
			async (
				type: typeof TYPE_ALT_TEXT | typeof TYPE_CAPTION,
				useBase64Image: boolean = false
			) => {
				if ( requireUpgrade ) {
					return;
				}

				startLoading( type );

				try {
					const context: { positions?: number[] } = {};

					if ( type === TYPE_ALT_TEXT ) {
						openBlockSidebar( props.clientId );
					}

					if ( type === TYPE_CAPTION ) {
						context.positions = [ props.clientId ];
					}

					dequeueAsyncRequest();

					const response = await askQuestionSync(
						[
							{
								role: 'jetpack-ai' as const,
								context: {
									type: type,
									content: getPostContent( preprocessImageContent ),
									...context,
									images: [
										{
											// We convert the image to a base64 string to avoid inaccesible URLs for private images.
											url: useBase64Image
												? await getBase64Image( props.attributes.url )
												: props.attributes.url,
										},
									],
								},
							},
						],
						{
							postId: getCurrentPostId(),
							feature: 'jetpack-ai-image-extension',
						}
					);

					increaseRequestsCount();

					const parsedResponse: { texts?: string[]; captions?: string[] } = JSON.parse(
						response
							?.replace?.( /^```json\s*/, '' ) // Remove the markdown code block if it exists.
							?.replace( /```$/, '' )
					);

					if ( type === TYPE_ALT_TEXT ) {
						const alt = parsedResponse.texts?.[ 0 ];
						updateBlockAttributes( props.clientId, { alt } );
					} else if ( type === TYPE_CAPTION ) {
						const caption = parsedResponse.captions?.[ 0 ];
						updateBlockAttributes( props.clientId, { caption } );
					}

					setLoading( type, false );
				} catch ( error ) {
					if ( error?.message.includes( 'The image URL is invalid' ) && ! useBase64Image ) {
						debug( 'Retrying with base64 image' );
						return request( type, true );
					}

					debug( `Error generating ${ type }`, error );

					if ( error?.message ) {
						showErrorNotice( error.message );
					}

					setLoading( type, false );
				}
			},
			[
				dequeueAsyncRequest,
				getCurrentPostId,
				getPostContent,
				increaseRequestsCount,
				props.attributes.url,
				props.clientId,
				requireUpgrade,
				showErrorNotice,
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
						loadingAltText={ loadingAltText }
						loadingCaption={ loadingCaption }
						disabled={ ! hasImage }
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
