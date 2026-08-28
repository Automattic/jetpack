import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getFormClientId, getFormFieldEntries } from '../../hooks/use-form-field-ids.js';
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
 * @param {string} excludeId - Client id to skip, along with everything inside it.
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

		// The subtree as well as the block itself. For a field that subtree is only its own
		// label and input, so this changes nothing; for a container it is the fields the
		// container governs, and conditioning a group on a field it contains is circular —
		// the answer that would reveal the group can only be given once the group is visible.
		if ( block.clientId === excludeId ) {
			return;
		}

		if ( 'jetpack/form-step' === block.name ) {
			currentStep = ( currentStep || 0 ) + 1;
		}

		const typeKey = getTypeKeyForBlockName( block.name );

		if ( typeKey ) {
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
 * Collect the fields a condition on `clientId` may reference.
 *
 * Returns every other field in the same form, annotated with the comparison behavior and
 * option list the rule builder needs, plus the step it sits in so the dropdown can group
 * them — a rule referencing a later step always compares against an empty value, and the
 * author should be able to see that rather than be silently prevented from writing it.
 *
 * @param {string} clientId - The field or container block owning the panel.
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
 * Collect the fields inside the block owning the panel.
 *
 * These are deliberately absent from the subject dropdown: conditioning a group on a field it
 * contains is circular, because the answer that would reveal the group can only be given once
 * the group is visible. Excluding them from what the author can *pick* is right; excluding them
 * from what the author can *see* is not.
 *
 * A rule can end up naming one of them without ever being written that way -- pick a subject
 * outside the group, then drag that field into it. The rule stays in the attribute and both
 * evaluators go on enforcing it, so the group hides for good. Resolving the summary against
 * these as well is what keeps that rule on screen, where it can be edited or removed, instead
 * of the panel claiming there are no conditions while one is still running.
 *
 * @param {string} clientId - The container block owning the panel.
 * @return {Array} Descriptors for the fields inside it.
 */
export const useEnclosedFields = clientId =>
	useSelect(
		select => {
			const block = select( 'core/block-editor' ).getBlock( clientId );

			if ( ! block?.innerBlocks?.length ) {
				return [];
			}

			const found = [];
			walk( block.innerBlocks, null, null, found );

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
 * The id is made unique against every field in the form, read at call time. The subject list
 * cannot serve that: it excludes the field owning the panel, and it excludes field blocks with
 * no comparison behaviour -- `jetpack/field-image-select` today -- both of which still hold ids
 * the renderer counts. Minting against the shorter list is how a fresh collision gets created.
 *
 * @return {Function} `( field ) => fieldId`, assigning an id when the field has none.
 */
export const useEnsureFieldId = () => {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const registry = useRegistry();

	return useCallback(
		field => {
			if ( ! field ) {
				return '';
			}
			if ( field.id ) {
				return field.id;
			}

			const usedIds = getFormFieldEntries( registry.select, field.clientId )
				.map( entry => entry.id )
				.filter( Boolean );

			const fieldId = generateUniqueFormFieldId( toFieldIdBase( field.label ), usedIds );
			updateBlockAttributes( field.clientId, { id: fieldId } );

			return fieldId;
		},
		[ registry, updateBlockAttributes ]
	);
};

export default useSubjectFields;
