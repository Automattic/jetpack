/*
 * External dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import metadata from '../../block.json';
import { isUserConnected } from '../../lib/connection';
import { getFeatureAvailability } from '../../lib/utils/get-feature-availability';

// We have two types of block extensions for now, transformative and inline.
// The transformative blocks are transformed into an AI Assistant block when a request is made.
// The inline blocks are updated in place.
// Once all transformative blocks are converted to inline blocks, we can remove the distinction, but for now, we need to keep it.

export const AI_ASSISTANT_SUPPORT_NAME = 'ai-assistant-support';
export const AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME = 'ai-assistant-extensions-support';

// Check if the AI Assistant support is enabled.
export const isAiAssistantSupportEnabled = getFeatureAvailability( AI_ASSISTANT_SUPPORT_NAME );
// Check if the AI Assistant inline extensions support is enabled.
export const isAiAssistantExtensionsSupportEnabled = getFeatureAvailability(
	AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME
);

// All Jetpack Form blocks to extend
export const JETPACK_FORM_CHILDREN_BLOCKS = [
	'jetpack/field-name',
	'jetpack/field-email',
	'jetpack/field-text',
	'jetpack/field-textarea',
	'jetpack/field-checkbox',
	'jetpack/field-date',
	'jetpack/field-telephone',
	'jetpack/field-url',
	'jetpack/field-checkbox-multiple',
	'jetpack/field-radio',
	'jetpack/field-select',
	'jetpack/field-consent',
	'jetpack/button',
] as const;

// The list of all extended blocks before the inline extensions were released. Does not include the list-item block.
export const ALL_EXTENDED_BLOCKS = [
	'core/paragraph',
	'core/list',
	'core/heading',
	'jetpack/contact-form',
	...JETPACK_FORM_CHILDREN_BLOCKS,
];

// The blocks will be converted one by one to inline blocks, so we update the lists accordingly, under the feature flag.
export let EXTENDED_TRANSFORMATIVE_BLOCKS: string[] = [ ...ALL_EXTENDED_BLOCKS ];
export const EXTENDED_INLINE_BLOCKS: string[] = [];

// Temporarily keep track of inline extensions that have been released to production.
const releasedInlineExtensions = [
	'core/heading',
	'core/paragraph',
	'core/list-item',
	'core/list',
	'jetpack/contact-form',
	...JETPACK_FORM_CHILDREN_BLOCKS,
];

// Temporarily keep track of inline extensions that are being worked on.
const unreleasedInlineExtensions = [];

releasedInlineExtensions.forEach( block => {
	// Add the released inline extension to the inline list...
	EXTENDED_INLINE_BLOCKS.push( block );
	// ...and remove it from the transformative list.
	EXTENDED_TRANSFORMATIVE_BLOCKS = EXTENDED_TRANSFORMATIVE_BLOCKS.filter( b => b !== block );
} );

unreleasedInlineExtensions.forEach( block => {
	if ( isAiAssistantExtensionsSupportEnabled ) {
		// Add the unreleased inline extension to the inline list...
		EXTENDED_INLINE_BLOCKS.push( block );
		// ...and remove it from the transformative list.
		EXTENDED_TRANSFORMATIVE_BLOCKS = EXTENDED_TRANSFORMATIVE_BLOCKS.filter( b => b !== block );
	}
} );

// Since the lists depend on the feature flag, we need to define the types manually.
export type ExtendedBlockProp = string;
export type ExtendedInlineBlockProp =
	| 'core/heading'
	| 'core/paragraph'
	| 'core/list-item'
	| 'core/list'
	| 'jetpack/contact-form'
	| ( typeof JETPACK_FORM_CHILDREN_BLOCKS )[ number ];

type BlockSettingsProps = {
	supports: {
		'jetpack/ai': {
			assistant: boolean;
		};
	};
};

/**
 * Check if it is possible to extend the block.
 *
 * @return {boolean} True if it is possible to extend the block.
 */
export function isPossibleToExtendBlock(): boolean {
	const isBlockRegistered = getBlockType( metadata.name );
	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check Jetpack extension is enabled.
	if ( ! isAiAssistantSupportEnabled ) {
		return false;
	}

	// Do not extend the block if the site is not connected.
	const connected = isUserConnected();
	if ( ! connected ) {
		return false;
	}

	// Do not extend if there is an error getting the feature.
	const { errorCode } = select( 'wordpress-com/plans' )?.getAiAssistantFeature?.() || {};
	if ( errorCode ) {
		return false;
	}

	/*
	 * Do not extend if the AI Assistant block is hidden
	 * ToDo: the `editPostStore` is undefined for P2 sites.
	 * Let's find a way to check if the block is hidden.
	 */
	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will extend the block if the function is undefined.
	if ( hiddenBlocks.includes( metadata.name ) ) {
		return false;
	}

	return true;
}

/**
 * Add jetpack/ai support to the extended blocks.
 *
 * @param {BlockSettingsProps} settings - Block settings.
 * @param {ExtendedBlockProp}  name     - Block name.
 * @return {BlockSettingsProps}          Block settings.
 */
function addJetpackAISupport(
	settings: BlockSettingsProps,
	name: ExtendedBlockProp
): BlockSettingsProps {
	// Only extend the blocks in the list.
	if ( ! EXTENDED_TRANSFORMATIVE_BLOCKS.includes( name ) ) {
		return settings;
	}

	// Do not extend Form blocks, as they are handled differently.
	const formBlocks = [ 'jetpack/contact-form', ...JETPACK_FORM_CHILDREN_BLOCKS ];
	if ( formBlocks.includes( name ) ) {
		return settings;
	}

	if ( ! isPossibleToExtendBlock() ) {
		return settings;
	}

	return {
		...settings,
		supports: {
			...settings.supports,
			'jetpack/ai': {
				assistant: true,
			},
		},
	};
}

// Extend BlockType.
addFilter( 'blocks.registerBlockType', 'jetpack/ai-assistant-support', addJetpackAISupport, 100 );
