import { generateUniqueFormFieldId } from './generate-unique-id.js';

/**
 * The field ids that more than one field in a form claims.
 *
 * Field ids are not unique and nothing in the editor makes them so: an id survives a copy, a
 * paste and a duplicate, the Name field's inserter variations ship fixed ones (`first-name`,
 * `last-name`), and the Name/ID control validates only the character set. So two fields
 * answering to `first-name` is an ordinary thing to end up with, not a corrupt document.
 *
 * It does matter, though. `Contact_Form_Field::__construct()` renames the later duplicate at
 * render, and anything that stores a field id -- a conditional-logic rule, a stored response
 * key, an email column -- cannot say which of the two it meant. Callers use this to tell the
 * author, at the point where they can fix it.
 *
 * Fields with no id are not duplicates of one another, and are reported as no id at all.
 *
 * @param {Array<string>} ids - One id per field; empty strings for fields without one.
 * @return {Set<string>} Ids claimed by more than one field.
 */
export const getDuplicateFieldIds = ( ids = [] ) => {
	const seen = new Set();
	const duplicates = new Set();

	ids.forEach( id => {
		if ( ! id ) {
			return;
		}

		if ( seen.has( id ) ) {
			duplicates.add( id );
			return;
		}

		seen.add( id );
	} );

	return duplicates;
};

/**
 * The renames that would make one duplicated id unique, the way the renderer already does it.
 *
 * `Contact_Form_Field::__construct()` keeps the first occurrence in document order and suffixes
 * the later ones -- `email`, `email-2`, `email-3` -- and this mirrors that exactly. Matching it
 * matters: every field renamed here is one the renderer was already renaming at output, so a
 * rule, a stored response key or an email column that names the base id goes on meaning the
 * field it always meant. Suffixes already taken by other fields are skipped.
 *
 * @param {Array}  entries - `{ clientId, id }` for every field in the form, in document order.
 * @param {string} id      - The duplicated id to resolve.
 * @return {Array} `{ clientId, id }` for each field that needs renaming; empty if none do.
 */
export const getRenamesForDuplicateId = ( entries, id ) => {
	if ( ! id ) {
		return [];
	}

	const used = new Set( ( entries || [] ).map( entry => entry.id ).filter( Boolean ) );
	const renames = [];
	let seen = false;

	( entries || [] ).forEach( entry => {
		if ( entry?.id !== id ) {
			return;
		}

		// The first one is the field the renderer already resolves this id to, so it keeps it.
		if ( ! seen ) {
			seen = true;
			return;
		}

		const nextId = generateUniqueFormFieldId( id, Array.from( used ) );

		used.add( nextId );
		renames.push( { clientId: entry.clientId, id: nextId } );
	} );

	return renames;
};
