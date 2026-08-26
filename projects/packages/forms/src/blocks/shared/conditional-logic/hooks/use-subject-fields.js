import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { generateUniqueFormFieldId } from '../../util/generate-unique-id.js';
import { getTypeKeyForBlockName } from '../util/block-types.js';
import { getFieldOptions } from '../util/field-options.ts';

/**
 * Turn a field label into a candidate field id.
 *
 * Matches what the Name/ID control accepts: alphanumerics, dash and underscore.
 *
 * @param {string} label - The field's visible label.
 * @return {string} A slug usable as a field id.
 */
// Matches register.jsx's own prefix check. Kept local rather than imported, because
// register.jsx registers the editor filter as an import side effect.
const FIELD_BLOCK_PREFIX = 'jetpack/field-';

const toFieldIdBase = label => {
	const slug = ( label || '' )
		.trim()
		.toLowerCase()
		.replace( /\s+/g, '-' )
		.replace( /[^a-z0-9_-]/g, '' );

	return slug || 'field';
};

/**
 * Read a field block's visible label.
 *
 * A checkbox and a consent field keep theirs on the standalone `jetpack/option` their
 * template inserts rather than on a `jetpack/label` block.
 *
 * Falls back to the explicit id, then to a placeholder: a field with neither a label nor an
 * id is still selectable, and an empty entry in the dropdown would be unusable.
 *
 * @param {object} block - The field block instance.
 * @return {string} A label suitable for the subject dropdown.
 */
const getFieldLabel = block => {
	const innerBlocks = block.innerBlocks || [];
	// Direct children only: the choice fields nest their options under a `jetpack/options`
	// wrapper, so a `jetpack/option` found here can only be a field's own inline label. The
	// block also declares `isStandalone` for this, but position holds for older markup saved
	// before that attribute existed.
	const inlineLabel = name =>
		innerBlocks.find( inner => inner.name === name )?.attributes?.label?.trim();

	const label = inlineLabel( 'jetpack/label' ) || inlineLabel( 'jetpack/option' );

	if ( label ) {
		return label;
	}

	const id = block.attributes?.id;
	const untitled = __( 'Untitled field', 'jetpack-forms' );

	if ( ! id ) {
		return untitled;
	}

	// An author's id is worth showing; one this panel minted from the placeholder is not, or
	// choosing an unnamed field renames it to "untitled-field" in the dropdown it was picked
	// from. `generateUniqueFormFieldId` only ever appends `-<n>`, so stripping that suffix is
	// enough to recognize one.
	const placeholderId = toFieldIdBase( untitled );
	const isMinted = id === placeholderId || id.replace( /-\d+$/, '' ) === placeholderId;

	return isMinted ? untitled : id;
};

/**
 * Walk a form's block tree collecting fields that can be referenced by a condition.
 *
 * @param {Array}  blocks    - Blocks to walk.
 * @param {string} excludeId - Client id to skip (the field owning the panel).
 * @param {number} step      - Current step number, or null outside a multi-step form.
 * @param {Array}  found     - Accumulator.
 */
const walk = ( blocks, excludeId, step, found ) => {
	if ( ! Array.isArray( blocks ) ) {
		return;
	}

	let currentStep = step;

	blocks.forEach( block => {
		if ( ! block ) {
			return;
		}

		if ( 'jetpack/form-step' === block.name ) {
			currentStep = ( currentStep || 0 ) + 1;
		}

		const typeKey = getTypeKeyForBlockName( block.name );

		if ( typeKey && block.clientId !== excludeId ) {
			// Fields are listed whether or not they carry an explicit `id`. Most do not: the
			// renderer derives one from the label at output time, so requiring the attribute
			// here would hide nearly every field and leave only the ones that ship a default
			// id (the Name field). An id is assigned when a field is actually chosen.
			found.push( {
				clientId: block.clientId,
				id: block.attributes?.id || '',
				label: getFieldLabel( block ),
				// The block's own registered title, so the dropdown uses the same words as the
				// inserter and there is no second list of type names to drift out of step.
				typeLabel: getBlockType( block.name )?.title || '',
				typeKey,
				options: getFieldOptions( block ),
				step: currentStep,
			} );
			return; // A field's own inner blocks hold its inputs, not other fields.
		}

		walk( block.innerBlocks, excludeId, currentStep, found );
	} );
};

/**
 * Every field block in a form, in document order.
 *
 * Deliberately broader than the walk above, in two ways, because this feeds id uniqueness
 * rather than the subject dropdown:
 *
 * It keeps the field that owns the panel. Uniqueness is a property of the whole form, and
 * `walk()` drops the owner, so a list built from it cannot say whether the owner comes before
 * or after a field it collides with -- and that ordering decides which of the two keeps the id.
 *
 * It matches on the block name alone rather than on conditional-logic support. PHP assigns
 * ids to every field it parses, so a field with no comparison behaviour still occupies an id
 * and still pushes a later duplicate along.
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
			found.push( { clientId: block.clientId, id: block.attributes?.id || '' } );
			return; // A field's own inner blocks hold its inputs, not other fields.
		}

		walkFieldIds( block.innerBlocks, found );
	} );
};

/**
 * Resolve the contact form a field sits in.
 *
 * @param {Function} select   - The data-registry select function.
 * @param {string}   clientId - A field block's client id.
 * @return {string|undefined} The form's client id, or the field's immediate root.
 */
const getFormClientId = ( select, clientId ) => {
	const { getBlockParentsByBlockName, getBlockRootClientId } = select( 'core/block-editor' );

	const formParents = getBlockParentsByBlockName( clientId, 'jetpack/contact-form' );

	// Fall back to the immediate root when the field is not inside a contact form yet,
	// which happens in pattern previews and legacy layouts.
	return formParents?.[ formParents.length - 1 ] || getBlockRootClientId( clientId );
};

/**
 * Every field id in the form, in document order, including the panel's own field.
 *
 * @param {string} clientId - The field block owning the panel.
 * @return {Array} `{ clientId, id }` for each field, in document order.
 */
export const useFormFieldIds = clientId =>
	useSelect(
		select => {
			const formClientId = getFormClientId( select, clientId );

			if ( ! formClientId ) {
				return [];
			}

			const form = select( 'core/block-editor' ).getBlock( formClientId );
			const found = [];
			walkFieldIds( form?.innerBlocks || [], found );

			return found;
		},
		[ clientId ]
	);

/**
 * Collect the fields a condition on `clientId` may reference.
 *
 * Returns every other field in the same form, annotated with the comparison behavior and
 * option list the rule builder needs, plus the step it sits in so the dropdown can group
 * them — a rule referencing a later step always compares against an empty value, and the
 * author should be able to see that rather than be silently prevented from writing it.
 *
 * @param {string} clientId - The field block owning the panel.
 * @return {Array} Subject field descriptors.
 */
const useSubjectFields = clientId =>
	useSelect(
		select => {
			const formClientId = getFormClientId( select, clientId );

			if ( ! formClientId ) {
				return [];
			}

			const form = select( 'core/block-editor' ).getBlock( formClientId );
			const found = [];
			walk( form?.innerBlocks || [], clientId, null, found );

			return found;
		},
		[ clientId ]
	);

/**
 * Get a function that guarantees a subject field has a stable id.
 *
 * Most fields carry no explicit `id`: the renderer derives one from the label when the form
 * is output. A rule cannot reference a derived id safely, because editing the label would
 * change it and the rule would quietly stop matching. Choosing a field as a condition
 * subject therefore assigns it the same kind of explicit id its Name/ID control writes.
 *
 * @return {Function} `( field, usedIds ) => fieldId`, assigning an id when the field has none.
 */
export const useEnsureFieldId = () => {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return useCallback(
		( field, usedIds = [] ) => {
			if ( ! field ) {
				return '';
			}
			if ( field.id ) {
				return field.id;
			}

			const fieldId = generateUniqueFormFieldId( toFieldIdBase( field.label ), usedIds );
			updateBlockAttributes( field.clientId, { id: fieldId } );

			return fieldId;
		},
		[ updateBlockAttributes ]
	);
};

export default useSubjectFields;
