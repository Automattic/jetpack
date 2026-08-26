import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { generateUniqueFormFieldId } from '../../util/generate-unique-id.js';

/**
 * Give every field in the form a distinct id, while the rule builder is open.
 *
 * Field ids are not automatically unique. A field carries its id verbatim through a copy,
 * a paste or a duplicate, and the Name field's inserter variations ship fixed ones
 * (`first-name`, `last-name`), so inserting "First name" twice is enough to end up with two
 * fields answering to `first-name`.
 *
 * That breaks the subject dropdown outright. Its options are keyed by field id, and a native
 * select addresses an option by value, so two options sharing a value are indistinguishable:
 * the browser resolves to the first and the second cannot be chosen at all.
 *
 * It also breaks the rule quietly, which is worse. `Contact_Form_Field::__construct()`
 * suffixes later duplicates at render (`first-name` -> `first-name-2`), so a rule naming
 * `first-name` always evaluates against whichever field renders first, whatever the author
 * picked.
 *
 * This mirrors that PHP rule exactly: walk the form in document order, let the first
 * occurrence of an id keep it, and suffix every later one. Because the renames match what
 * PHP was already doing at render, a stored rule -- and a stored response key, and an email
 * column -- goes on meaning the field it always meant. Getting the order wrong would invert
 * that and silently swap two fields' identities, so `fields` must arrive in true document
 * order and must include the field that owns the panel: see `useFormFieldIds`.
 *
 * Deliberately narrow. It runs only while `isActive` -- the builder being open -- and not on
 * load or on insertion, because rewriting ids as a form loads would touch posts nobody is
 * editing and dirty them behind the author's back. It also only ever *renames* an id that
 * already collides: a field with no id is left alone, since the dropdown keys those by client
 * id and they are already unambiguous, and minting one would be exactly the automatic id
 * assignment this is meant to avoid.
 *
 * @param {Array}   fields   - `{ clientId, id }` for every field in the form, in document order.
 * @param {boolean} isActive - Whether the rule builder is open.
 */
const useDeduplicateFieldIds = ( fields, isActive ) => {
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// useSelect hands back a fresh array on every block-editor store change, so keying the
	// effect on `fields` would re-run it on each keystroke anywhere in the post. Only the ids
	// and their owners matter here, and a JSON signature of exactly those changes when they
	// do -- and not otherwise.
	const { signature, entries } = useMemo( () => {
		const list = ( fields || [] ).map( field => ( {
			clientId: field.clientId,
			id: field.id,
		} ) );

		return { signature: JSON.stringify( list ), entries: list };
	}, [ fields ] );

	useEffect( () => {
		if ( ! isActive ) {
			return;
		}

		const used = new Set();
		const renames = [];

		entries.forEach( field => {
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

		renames.forEach( ( [ clientId, id ] ) => {
			// The repair is a correction, not an edit the author made, so it should not land
			// as an undo step of its own -- opening the dialog and closing it again would
			// otherwise leave a Ctrl-Z that reverts a rename nobody asked for. The change is
			// still saved; it merges into the surrounding undo level. Same treatment the
			// form-step block gives its generated List View label.
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( clientId, { id } );
		} );
		// `entries` is omitted deliberately: it changes identity whenever the store ticks,
		// while `signature` changes exactly when its contents do. Since the two are computed
		// together, the entries this closure holds are always the ones `signature` describes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isActive, signature, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent ] );
};

export default useDeduplicateFieldIds;
