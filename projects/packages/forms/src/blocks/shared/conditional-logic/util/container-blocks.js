/**
 * Container blocks that can carry conditional logic.
 *
 * A container differs from a field in both directions of the feature. It can be the *target*
 * of conditions — shown or hidden as a unit, taking the fields it holds with it — but it
 * never holds a value, so it is never the *subject* of one and never appears in the rule
 * builder's dropdown. That is why this list is separate from the type map in
 * `block-types.js`: an entry there declares how a block's value compares, and a container has
 * no value to compare.
 *
 * `core/row` and `core/stack` are variations of `core/group` rather than blocks of their own,
 * so they register under `core/group` and are covered by the single name here.
 *
 * @type {string[]}
 */
export const CONTAINER_BLOCK_NAMES = [ 'core/group' ];

/**
 * Whether a block can carry conditional logic as a container.
 *
 * Being a container is necessary but not sufficient: `core/group` exists on every screen in
 * the editor, and the panel is only meaningful inside a form. The caller pairs this with an
 * ancestor check.
 *
 * @param {string} name - Fully qualified block name.
 * @return {boolean} True when the block is a supported container.
 */
export const isConditionalLogicContainer = name =>
	typeof name === 'string' && CONTAINER_BLOCK_NAMES.includes( name );
