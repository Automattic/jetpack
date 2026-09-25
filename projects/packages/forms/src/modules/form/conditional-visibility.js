import { resolveVisibility } from '../../blocks/shared/conditional-logic/util/evaluate.ts';

/**
 * Resolved visibility, memoized per form.
 *
 * Keyed by form hash rather than held in a single slot: a page can carry more than one form,
 * and two forms often produce the same value signature — field ids are derived from labels,
 * so a "Name"/"Other" pair repeats readily. A shared slot would hand one form's visibility
 * map to another and show or hide the wrong fields.
 *
 * @type {Map<string, {signature: string, map: object}>}
 */
const memoByForm = new Map();

/**
 * Discard memoized visibility. Exposed for tests.
 *
 * @return {void}
 */
export const clearVisibilityMemo = () => {
	memoByForm.clear();
};

/**
 * Resolve visibility for every field in the form the current field belongs to.
 *
 * The form block emits `conditionalLogic` as `{ types, logic }`: a type for every field, so
 * rules can reference any of them, plus logic for only the fields that have some. When no
 * field uses conditional logic the key is absent and this returns null, so callers can skip
 * the work entirely.
 *
 * `isFieldHidden` is read once per field but conditional logic cascades across the whole
 * form, so the resolver considers every field on each call; the memo keeps a keystroke at one
 * resolution rather than one per field.
 *
 * @param {object} context - The interactivity context, merged from form and field level.
 * @return {object|null} Map of field id to visibility, or null when nothing is conditional.
 */
export const resolveFormVisibility = context => {
	const conditionalLogic = context?.conditionalLogic;
	const logicByField = conditionalLogic?.logic;

	if ( ! logicByField || ! Object.keys( logicByField ).length ) {
		return null;
	}

	const typesByField = conditionalLogic.types || {};
	// Only date fields carry one; the comparison needs it to read the value the way the
	// datepicker wrote it.
	const formatsByField = conditionalLogic.formats || {};
	const fields = context.fields || {};
	const values = {};
	for ( const id in fields ) {
		values[ id ] = fields[ id ]?.value;
	}

	const formKey = context.formHash || 'default';
	const signature = JSON.stringify( values );
	const cached = memoByForm.get( formKey );

	if ( cached && cached.signature === signature ) {
		return cached.map;
	}

	const descriptors = {};
	for ( const id in typesByField ) {
		descriptors[ id ] = {
			logic: logicByField[ id ] || null,
			type: typesByField[ id ],
			format: formatsByField[ id ],
		};
	}

	const map = resolveVisibility( descriptors, values );
	memoByForm.set( formKey, { signature, map } );

	return map;
};

/**
 * Whether a field is currently hidden by conditional logic.
 *
 * Validation has to agree with what is on screen. A required field the visitor cannot see is
 * one they cannot fill, so counting its error would block the form with nothing to explain
 * why — the submit button simply stops working. The server drops the same fields before
 * validating, so skipping them here keeps the two sides in step.
 *
 * @param {object} context - The interactivity context.
 * @param {string} fieldId - The field's id.
 * @return {boolean} True when conditional logic hides the field.
 */
export const isFieldHiddenByLogic = ( context, fieldId ) => {
	const visibility = resolveFormVisibility( context );

	return !! visibility && false === visibility[ fieldId ];
};
