import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import { dispatch } from '@wordpress/data';
import { store as editPostStore } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { addFilter } from '@wordpress/hooks';
import debugFactory from 'debug';
import metadata from '../../blocks/ai-assistant/block.json';
import { isPossibleToExtendBlock } from '../../blocks/ai-assistant/extensions/ai-assistant';
import { aiExcerptPluginName, aiExcerptPluginSettings } from '.';

const debug = debugFactory( 'jetpack-ai-content-lens:registration' );

export const AI_CONTENT_LENS = 'ai-content-lens';

const isAiAssistantSupportExtensionEnabled =
	window?.Jetpack_Editor_Initial_State?.available_blocks[ 'ai-content-lens' ];

/**
 * Extend the editor with AI Content Lens features,
 * as long as the AI Assistant block is registered.
 *
 * @param {object} settings - Block settings.
 * @param {string} name     - Block name.
 * @returns {object}          Block settings.
 */
function extendAiContentLensFeatures( settings, name ) {
	// Bail early when the block is not the AI Assistant.
	if ( name !== metadata.name ) {
		return settings;
	}

	/*
	 * Bail early when the AI Assistant block is not registered.
	 * It will handle with the site requires an upgrade.
	 */
	if ( ! isPossibleToExtendBlock() ) {
		return settings;
	}

	// Register AI Excerpt plugin.
	registerJetpackPlugin( aiExcerptPluginName, aiExcerptPluginSettings );
	debug( 'Registered AI Excerpt plugin' );

	// check if the removeEditorPanel function exists in the editorStore.
	// íf not, look for it in the editPostStore.
	// @todo: remove this once Jetpack requires WordPres 6.5,
	// where the removeEditorPanel function will be available in the editorStore.
	const removeEditorPanel = dispatch( editorStore )?.removeEditorPanel
		? dispatch( editorStore )?.removeEditorPanel
		: dispatch( editPostStore )?.removeEditorPanel;

	// Remove the excerpt panel by dispatching an action.
	removeEditorPanel( 'post-excerpt' );
	debug( 'Removed the post-excerpt panel' );

	return settings;
}

// Filter only if the extension is enabled.
if ( isAiAssistantSupportExtensionEnabled?.available ) {
	addFilter(
		'blocks.registerBlockType',
		'jetpack/ai-content-lens-features',
		extendAiContentLensFeatures
	);
	debug( 'Added filter for AI Content Lens features' );
}
