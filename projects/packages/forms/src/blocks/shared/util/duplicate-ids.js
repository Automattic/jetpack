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
