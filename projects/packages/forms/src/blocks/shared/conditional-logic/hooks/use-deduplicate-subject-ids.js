import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { generateUniqueFormFieldId } from '../../util/generate-unique-id.js';

/**
 * Give every field in the subject dropdown a distinct id, while the rule builder is open.
 *
 * Field ids are not automatically unique. A field carries its id verbatim through a copy,
 * a paste or a duplicate, and the Name field's inserter variations ship fixed ones
 * (`first-name`, `last-name`), so inserting "First name" twice is enough to end up with two
 * fields answering to `first-name`.
 *
 * That breaks the dropdown outright. Its options are keyed by field id, and a native select
 * addresses an option by value, so two options sharing a value are indistinguishable: the
 * browser resolves to the first and the second cannot be chosen at all.
 *
 * It also breaks the rule quietly, which is worse. `Contact_Form_Field::__construct()`
 * suffixes later duplicates at render (`first-name` -> `first-name-2`), so a rule naming
 * `first-name` always evaluates against whichever field renders first, whatever the author
 * picked. Renaming here keeps the *first* occurrence and suffixes the rest, exactly as PHP
 * does, so an existing rule keeps pointing at the field it already meant.
 *
 * Deliberately narrow. It runs only while `isActive` -- the builder being open -- and not on
 * load or on insertion, because rewriting ids as a form loads would touch posts nobody is
 * editing and dirty them behind the author's back. It also only ever *renames* an id that
 * already collides: a field with no id is left alone, since it is keyed by client id in the
 * dropdown and so already unambiguous, and minting one would be exactly the automatic id
 * assignment this is meant to avoid.
 *
 * @param {Array}   fields     - Subject field descriptors, in document order.
 * @param {string}  ownFieldId - Id of the field owning the panel. It is absent from `fields`,
 *                             so it is invisible to the collision check and has to be seeded
 *                             into the used set by hand or a repair can rename onto it.
 * @param {boolean} isActive   - Whether the rule builder is open.
 */
const useDeduplicateSubjectFieldIds = ( fields, ownFieldId, isActive ) => {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	// useSelect hands back a fresh array on every block-editor store change, so depending on
	// `fields` itself would re-run this on each keystroke anywhere in the post. The ids and
	// their owners are all this cares about, and they change far more rarely.
	const signature = fields.map( field => `${ field.clientId }:${ field.id }` ).join( '|' );

	// Read through a ref so the effect can see the current descriptors without listing the
	// array as a dependency and reinstating the churn `signature` exists to avoid.
	const fieldsRef = useRef( fields );
	fieldsRef.current = fields;

	useEffect( () => {
		if ( ! isActive ) {
			return;
		}

		const used = new Set();

		if ( ownFieldId ) {
			used.add( ownFieldId );
		}

		const renames = [];

		fieldsRef.current.forEach( field => {
			if ( ! field.id ) {
				return;
			}

			if ( ! used.has( field.id ) ) {
				used.add( field.id );
				return;
			}

			const nextId = generateUniqueFormFieldId( field.id, Array.from( used ) );

			used.add( nextId );
			renames.push( [ field.clientId, nextId ] );
		} );

		renames.forEach( ( [ clientId, id ] ) => updateBlockAttributes( clientId, { id } ) );
	}, [ isActive, signature, ownFieldId, updateBlockAttributes ] );
};

export default useDeduplicateSubjectFieldIds;
