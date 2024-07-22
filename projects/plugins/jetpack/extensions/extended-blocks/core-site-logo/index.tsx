/*
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { Modal } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../blocks/ai-assistant/lib/utils/get-feature-availability';
import AiToolbarButton from './components/ai-toolbar-button.js';
import { SITE_LOGO_BLOCK_AI_EXTENSION } from './constants.js';

/**
 * HOC to add the AI button on the Site Logo toolbar.
 */
const siteLogoEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
		const [ isLogoGeneratorModalVisible, setIsLogoGeneratorModalVisible ] = useState( false );

		const showModal = useCallback( () => {
			setIsLogoGeneratorModalVisible( true );
		}, [] );

		const closeModal = useCallback( () => {
			setIsLogoGeneratorModalVisible( false );
		}, [] );

		useEffect( () => {
			return () => {
				// close modal if open
				closeModal();
			};
		}, [ closeModal ] );

		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls group="block">
					<AiToolbarButton clickHandler={ showModal } />
				</BlockControls>
				{ isLogoGeneratorModalVisible && (
					<Modal title={ __( 'Coming soon', 'jetpack' ) } onRequestClose={ closeModal }>
						<p>{ __( 'Coming soon', 'jetpack' ) }</p>
					</Modal>
				) }
			</>
		);
	};
}, 'SiteLogoEditWithAiComponents' );

/**
 * Function to override the core Site Logo block edit settings.
 * Will create a HOC to use as the edit implementation.
 *
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @return {object} The new block settings.
 */
function jetpackSiteLogoWithAiSupport( settings, name: string ) {
	// Only extend the core Site Logo block.
	if ( name !== 'core/site-logo' ) {
		return settings;
	}

	// Disable if the feature is not available.
	if ( ! getFeatureAvailability( SITE_LOGO_BLOCK_AI_EXTENSION ) ) {
		return settings;
	}

	return {
		...settings,
		edit: siteLogoEditWithAiComponents( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/site-logo-with-ai-support',
	jetpackSiteLogoWithAiSupport,
	100
);
