import { childBlocks } from '../../../contact-form/child-blocks.js';

/**
 * Block name to comparison behavior, derived from the blocks themselves.
 *
 * Each field block declares its own `conditional_logic.type` alongside `form_editor`, so this
 * is assembled rather than maintained by hand. That matters: a hand-written table has to
 * restate every block's registered name, and two of them do not match their directory
 * (`field-single-choice` registers as `jetpack/field-radio`, `field-multiple-choice` as
 * `jetpack/field-checkbox-multiple`) — which is exactly how both silently lost their panel
 * once already. Prefixing the block's own `name` here cannot get that wrong.
 *
 * A block with no declaration is absent from the map and gets no conditional-logic support,
 * so the feature can be enabled one block at a time.
 *
 * @type {Record<string, string>|null}
 */
let typeKeyByBlockName = null;

/**
 * Build the lookup on first use.
 *
 * Must stay lazy. child-blocks.js side-effect imports the registration module, which imports
 * this file, so reading `childBlocks` while this module is evaluating would see a
 * part-initialised array. By the time anything asks for a type, both modules are ready.
 *
 * @return {Record<string, string>} Map of fully qualified block name to type key.
 */
const getMap = () => {
	if ( typeKeyByBlockName ) {
		return typeKeyByBlockName;
	}

	typeKeyByBlockName = {};

	for ( const block of childBlocks ) {
		const type = block?.conditional_logic?.type;

		if ( type && block?.name ) {
			typeKeyByBlockName[ `jetpack/${ block.name }` ] = type;
		}
	}

	return typeKeyByBlockName;
};

/**
 * Resolve a block name to its comparison behavior.
 *
 * @param {string} [blockName] - Fully qualified block name, e.g. `jetpack/field-select`.
 * @return {string|null} The type key, or null when the block declares no conditional logic.
 */
export const getTypeKeyForBlockName = blockName => {
	if ( ! blockName ) {
		return null;
	}

	return getMap()[ blockName ] ?? null;
};

/**
 * Every block that supports conditional logic, for tests and debugging.
 *
 * @return {Record<string, string>} Map of fully qualified block name to type key.
 */
export const getConditionalLogicBlockTypes = () => ( { ...getMap() } );
