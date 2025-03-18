/*
 * External dependencies
 */
import {
	getJetpackExtensionAvailability,
	useModuleStatus,
} from '@automattic/jetpack-shared-extension-utils';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import { store } from './store';
import { useSeoModuleSettings } from './use-seo-module-settings';
import { useSeoRequests } from './use-seo-requests';
/*
 * Types
 */
import type { Block } from '@automattic/jetpack-ai-client';

const isSeoEnhancerEnabled =
	getJetpackExtensionAvailability( 'ai-seo-enhancer' )?.available === true;

function isPossibleToExtendImageBlock( blockName: string ): boolean {
	return blockName === 'core/image' && isSeoEnhancerEnabled;
}

const blockEditWithSeoAutoGeneration = createHigherOrderComponent( BlockEdit => {
	function ExtendedBlock( props ) {
		const { updateAltText } = useSeoRequests();
		const { isEnabled: isAutoEnhanceEnabled } = useSeoModuleSettings();
		const { getBlock, isImageAltTextFeatureEnabled } = useSelect( select => {
			const { getBlock: getBlockFromEditor } = select( 'core/block-editor' ) as {
				getBlock: ( clientId: string ) => Block;
			};
			const { isImageAltTextFeatureEnabled: isFeatureEnabled } = select( store );

			return { getBlock: getBlockFromEditor, isImageAltTextFeatureEnabled: isFeatureEnabled };
		}, [] );
		const previousUrl = useRef( props.attributes.url );

		// Automatically update the alt text when an image is added without alt text.
		useEffect( () => {
			const hasUrlChanged = previousUrl.current !== props.attributes.url;
			const hasNoAltText = ! props.attributes.alt;
			const shouldAutoUpdateAltText = isAutoEnhanceEnabled && isImageAltTextFeatureEnabled();

			if ( props.attributes.url && hasUrlChanged && hasNoAltText && shouldAutoUpdateAltText ) {
				const block = getBlock( props.clientId );

				if ( block ) {
					updateAltText( block );
				}
			}

			previousUrl.current = props.attributes.url;
		}, [
			props.attributes.url,
			props.attributes.alt,
			props.clientId,
			getBlock,
			updateAltText,
			isAutoEnhanceEnabled,
			isImageAltTextFeatureEnabled,
		] );

		return <BlockEdit { ...props } />;
	}

	return props => {
		const { isModuleActive } = useModuleStatus( 'seo-tools' );

		if ( ! isModuleActive ) {
			return <BlockEdit { ...props } />;
		}

		return <ExtendedBlock { ...props } />;
	};
}, 'blockEditWithSeoAutoGeneration' );

export function blockWithSeoAutoGenerationExtension( settings, name: string ) {
	if ( ! isPossibleToExtendImageBlock( name ) ) {
		return settings;
	}

	return {
		...settings,
		edit: blockEditWithSeoAutoGeneration( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/ai-assistant-support/with-seo-auto-generation',
	blockWithSeoAutoGenerationExtension,
	100
);
