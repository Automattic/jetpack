import { useSelect } from '@wordpress/data';
import { FIELD_BLOCK_PREFIX, FORM_BLOCK_NAME } from '../util/constants.js';

// Returned whenever there is nothing to report, so the result stays reference-stable and
// consumers do not re-run on every store change.
const NO_FIELD_IDS = [];

/**
 * Resolve the contact form a field sits in.
 *
 * Exported for other selectors that need the same lookup inside their own `useSelect`, which
 * a hook cannot provide.
 *
 * @param {Function} select   - The data-registry select function.
 * @param {string}   clientId - A field block's client id.
 * @return {string|undefined} The form's client id, or the field's immediate root.
 */
export const getFormClientId = ( select, clientId ) => {
	const { getBlockParentsByBlockName, getBlockRootClientId } = select( 'core/block-editor' );

	const formParents = getBlockParentsByBlockName( clientId, FORM_BLOCK_NAME );

	// Fall back to the immediate root when the field is not inside a contact form yet,
	// which happens in pattern previews and legacy layouts.
	return formParents?.[ formParents.length - 1 ] || getBlockRootClientId( clientId );
};

/**
 * Collect the id of every field block, in document order.
 *
 * Matches on the block name alone rather than on any per-feature capability: PHP assigns an
 * id to every field it parses, so a field that supports nothing still occupies one.
 *
 * @param {Array} blocks - Blocks to walk.
 * @param {Array} found  - Accumulator.
 */
const walkFieldIds = ( blocks, found ) => {
	if ( ! Array.isArray( blocks ) ) {
		return;
	}

	blocks.forEach( block => {
		if ( ! block ) {
			return;
		}

		if ( typeof block.name === 'string' && block.name.startsWith( FIELD_BLOCK_PREFIX ) ) {
			found.push( block.attributes?.id || '' );
			return; // A field's own inner blocks hold its inputs, not other fields.
		}

		walkFieldIds( block.innerBlocks, found );
	} );
};

/**
 * The id of every field in the form a block belongs to, including that block's own.
 *
 * Field ids are only unique by convention, so anything checking that convention has to see
 * the whole form -- including the block doing the checking, which is just as able to collide
 * as any other field. Containers are descended through, because a form may nest fields inside
 * a Group or Columns.
 *
 * Ids are returned as plain strings so the array compares shallow-equal between renders: a
 * `useSelect` result rebuilt from objects is a fresh reference on every block-editor change,
 * which in the editor means every keystroke anywhere in the post.
 *
 * @param {string}  clientId   - A field block inside the form.
 * @param {boolean} [isActive] - Pass false to skip the walk entirely while nothing needs it.
 * @return {Array<string>} One id per field, in document order; `''` for fields without one.
 */
const useFormFieldIds = ( clientId, isActive = true ) =>
	useSelect(
		select => {
			// Returning before touching `select` leaves this hook subscribed to nothing, so
			// an inactive caller costs a single render rather than a walk per store change.
			if ( ! isActive ) {
				return NO_FIELD_IDS;
			}

			const formClientId = getFormClientId( select, clientId );

			if ( ! formClientId ) {
				return NO_FIELD_IDS;
			}

			const form = select( 'core/block-editor' ).getBlock( formClientId );
			const found = [];
			walkFieldIds( form?.innerBlocks || [], found );

			return found;
		},
		[ clientId, isActive ]
	);

export default useFormFieldIds;
