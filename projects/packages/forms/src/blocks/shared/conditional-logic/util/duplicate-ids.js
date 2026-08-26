/**
 * The field ids that more than one field in the form claims.
 *
 * Field ids are not unique and nothing in the editor makes them so: an id survives a copy, a
 * paste and a duplicate, the Name field's inserter variations ship fixed ones (`first-name`,
 * `last-name`), and the Name/ID control validates only the character set. So two fields
 * answering to `first-name` is an ordinary thing to end up with, not a corrupt document.
 *
 * A rule stores the id of the field it compares against, so an id shared by two fields cannot
 * say which one is meant -- and `Contact_Form_Field::__construct()` renames the later
 * duplicate at render, which means the id a rule stores may not even belong to the same field
 * once the form is output. Rather than guess, the rule builder refuses to offer such a field
 * and tells the author to give it a unique Name/ID.
 *
 * Fields with no id at all are not duplicates of each other: the dropdown keys those by
 * client id, so they stay individually selectable, and choosing one assigns it an id then.
 *
 * @param {Array} fields - `{ id }` for each field in the form.
 * @return {Set<string>} Ids claimed by more than one field.
 */
export const getDuplicateFieldIds = fields => {
	const seen = new Set();
	const duplicates = new Set();

	( fields || [] ).forEach( field => {
		const id = field?.id;

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
