/**
 * External dependencies
 */
import { VisuallyHidden } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Link, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import {
	EMAIL_REGEX,
	inferFieldTypeFromLabel,
} from './components/inspector/response-fields/field-preview/field-preview-utils.ts';
import FieldRating from './components/inspector/response-fields/field-rating/index.tsx';
import {
	isFieldsCollection,
	isFileUploadField,
	isImageSelectField,
} from './components/inspector/utils.ts';
/**
 * Types
 */
import type { FieldType, FileItem, FormResponse, ResponseField } from '../types/index.ts';
import type { Field, View } from '@wordpress/dataviews';

/**
 * Prefix keeping generated column ids clear of the built-in ones ( 'from', 'date', 'ip', … ).
 */
const COLUMN_ID_PREFIX = 'field:';

/** Announced in place of the em dash that marks a field this response left blank. */
const NO_ANSWER_LABEL = __( 'No answer', 'jetpack-forms' );

/**
 * Field types whose answer is one of a fixed set of choices, so it reads as a badge
 * rather than as free text. Mirrors the response inspector's own list.
 */
const BADGED_VALUE_FIELDS: FieldType[] = [ 'consent', 'checkbox', 'radio', 'select' ];

export type ResponseFieldColumn = {
	/** The DataViews field id. */
	id: string;
	/** The form field id from the form schema, or '' on a response predating them. */
	fieldId: string;
	/** The response's own field key, used only where there is no form field id. */
	key: string;
	/** The column header. */
	label: string;
	/** The form field type, so the cell can render the way the inspector does. */
	type: FieldType;
};

/**
 * The identifier a column is tracked by.
 *
 * The form field id is the only identifier that survives a field being moved. A
 * response's `key` is `<position>_<label>`, so reordering a form renumbers the key of
 * every field after the moved one — which both splits a single field into two columns
 * and, because the column then reads whatever now occupies that position, files one
 * field's answer under another field's header.
 *
 * Responses stored before form field ids existed carry none, and fall back to the key.
 *
 * @param field - The response field.
 * @return        The identity, or '' for a field that carries neither.
 */
const getFieldIdentity = ( field: ResponseField ): string => String( field.id || field.key || '' );

/**
 * Labels are the only thing a response predating form field ids can be matched on, so
 * they are compared leniently — case and surrounding space are not meaningful here.
 *
 * @param label - The field label.
 * @return        The label in comparable form.
 */
const normalizeLabel = ( label: string ): string => label.trim().toLowerCase();

/**
 * Reads a response's fields as a list, whatever shape they arrived in.
 *
 * `useInboxData` passes collection-format fields through untouched and flattens
 * legacy `label-value` fields into a label-keyed object, so both shapes land here.
 *
 * @param response - The form response.
 * @return           The response's fields, normalized to a list.
 */
const getFieldList = ( response: FormResponse ): ResponseField[] => {
	const fields = response?.fields;

	if ( ! fields || typeof fields !== 'object' ) {
		return [];
	}

	// `isFieldsCollection` handles both true arrays and the numeric-keyed objects
	// PHP's JSON encoding can produce.
	if ( isFieldsCollection( fields ) ) {
		return Object.values( fields ) as ResponseField[];
	}

	// Legacy shape: the label is the only stable identifier available.
	return Object.entries( fields ).map( ( [ label, value ] ) => ( { key: label, label, value } ) );
};

/**
 * The ways a single response's fields can be looked up.
 *
 * `hasFieldIds` says whether this response was stored with form field ids at all. When it
 * was, an id match is the whole answer: a column whose field is absent from the response
 * is absent, and must not fall through to a positional key that now belongs to a
 * different field. Only a response without ids may be matched the looser ways.
 */
type FieldIndex = {
	byFieldId: Map< string, ResponseField >;
	byKey: Map< string, ResponseField >;
	byLabel: Map< string, ResponseField >;
	hasFieldIds: boolean;
};

/**
 * Per-response lookup, so a row's fields are walked once rather than once per cell.
 *
 * Keyed on the record object, so the index holds for as long as a render pass reuses the
 * same records. `useInboxData` rebuilds every record whenever it recomputes, so a refetch
 * simply misses and rebuilds; entries fall away with the records themselves, and there is
 * nothing to invalidate.
 */
const fieldIndexes = new WeakMap< FormResponse, FieldIndex >();

const getFieldIndex = ( response: FormResponse ): FieldIndex => {
	let index = fieldIndexes.get( response );

	if ( ! index ) {
		index = {
			byFieldId: new Map(),
			byKey: new Map(),
			byLabel: new Map(),
			hasFieldIds: false,
		};

		for ( const field of getFieldList( response ) ) {
			// First writer wins throughout: a form with two identically labelled fields
			// would otherwise have the later one shadow the earlier in the label index.
			if ( field.id ) {
				index.hasFieldIds = true;

				if ( ! index.byFieldId.has( String( field.id ) ) ) {
					index.byFieldId.set( String( field.id ), field );
				}
			}

			if ( field.key !== undefined && ! index.byKey.has( String( field.key ) ) ) {
				index.byKey.set( String( field.key ), field );
			}

			const label = normalizeLabel( decodeEntities( String( field.label ?? '' ) ) );

			if ( label && ! index.byLabel.has( label ) ) {
				index.byLabel.set( label, field );
			}
		}

		fieldIndexes.set( response, index );
	}

	return index;
};

/**
 * Collects one column per distinct form field across the given responses.
 *
 * Responses on a single form share a form, but not necessarily a form *version* —
 * a field added or removed since an older submission only shows up on the
 * responses that carry it, so the column set is the union across all of them.
 *
 * @param responses - The responses currently loaded.
 * @return            One column descriptor per distinct field, in first-seen order.
 */
export const getResponseFieldColumns = ( responses: FormResponse[] ): ResponseFieldColumn[] => {
	const columns = new Map< string, ResponseFieldColumn >();
	// Which identity a given label was first claimed by, so a form whose older responses
	// predate form field ids does not get one column per storage generation.
	const identityByLabel = new Map< string, string >();

	/*
	 * A form field id, wherever one exists in this batch, keyed by label.
	 *
	 * Taken in a first pass rather than as the batch is walked, because otherwise the
	 * identity of a column would depend on which response happened to come first: a form
	 * holding both pre- and post-field-id responses would produce `field:g5-name` when
	 * sorted one way and `field:1_Name` when sorted the other, and a stored column choice
	 * keyed on one of those would not survive the other. Preferring the id whenever the
	 * batch supplies one anywhere makes the identity independent of order.
	 */
	const fieldIdByLabel = new Map< string, string >();

	for ( const response of responses ?? [] ) {
		for ( const field of getFieldList( response ) ) {
			if ( ! field.id ) {
				continue;
			}

			const label = normalizeLabel( decodeEntities( String( field.label ?? '' ) ) );

			if ( label && ! fieldIdByLabel.has( label ) ) {
				fieldIdByLabel.set( label, String( field.id ) );
			}
		}
	}

	for ( const response of responses ?? [] ) {
		for ( const field of getFieldList( response ) ) {
			const ownLabel = normalizeLabel( decodeEntities( String( field.label ?? '' ) ) );
			const borrowedId = field.id ? '' : fieldIdByLabel.get( ownLabel ) ?? '';
			const identity = borrowedId || getFieldIdentity( field );

			if ( ! identity || columns.has( identity ) ) {
				continue;
			}

			const label = decodeEntities( String( field.label || identity ) );
			const labelKey = normalizeLabel( label );
			const claimedBy = labelKey ? columns.get( identityByLabel.get( labelKey ) ?? '' ) : undefined;

			// A field already on screen under this label is the same field when either
			// side is unidentified — the only thing the two can be compared on is the
			// label. Two fields that both carry ids are distinct even when they share a
			// label, and each keeps its own column.
			if ( claimedBy && ( ! claimedBy.fieldId || ! field.id ) ) {
				continue;
			}

			columns.set( identity, {
				id: `${ COLUMN_ID_PREFIX }${ identity }`,
				fieldId: String( field.id ?? borrowedId ),
				key: String( field.key ?? '' ),
				label,
				// Legacy responses carry no type (or a useless 'basic'); the inspector
				// infers one from the label in that case, so match it.
				type:
					field.type && field.type !== 'basic'
						? ( field.type as FieldType )
						: inferFieldTypeFromLabel( label ) ?? 'text',
			} );

			if ( labelKey && ! identityByLabel.has( labelKey ) ) {
				identityByLabel.set( labelKey, identity );
			}
		}
	}

	return Array.from( columns.values() );
};

/**
 * Merges newly discovered columns into the ones already on screen.
 *
 * Columns are kept for as long as the form is open rather than recomputed from
 * whatever page happens to be loaded: dropping one mid-session would take the
 * user's column choice with it.
 *
 * @param previous   - The columns discovered so far.
 * @param discovered - The columns in the current result set.
 * @return             The merged list — `previous` itself when nothing is new.
 */
export const mergeResponseFieldColumns = (
	previous: ResponseFieldColumn[],
	discovered: ResponseFieldColumn[]
): ResponseFieldColumn[] => {
	const knownIds = new Set( previous.map( column => column.id ) );
	const knownByLabel = new Map(
		previous.map( column => [ normalizeLabel( column.label ), column ] as const )
	);

	const additions = discovered.filter( column => {
		if ( knownIds.has( column.id ) ) {
			return false;
		}

		// Same rule as within a single batch: an unidentified column and a labelled
		// match are the same field, since the label is all they can be compared on.
		const claimedBy = knownByLabel.get( normalizeLabel( column.label ) );

		return ! ( claimedBy && ( ! claimedBy.fieldId || ! column.fieldId ) );
	} );

	return additions.length === 0 ? previous : [ ...previous, ...additions ];
};

/**
 * Renders a field's value as a single line of text.
 *
 * @param field - The response field, if the response has one for this column.
 * @return        The value as text, or an empty string when there is nothing to show.
 */
const getFieldText = ( field?: ResponseField ): string => {
	const value = field?.value;

	if ( value === null || value === undefined ) {
		return '';
	}

	if ( isImageSelectField( value ) ) {
		const { choices = [] } = value as { choices?: Array< { selected?: string; label?: string } > };
		return choices
			.map( choice => choice?.label || choice?.selected || '' )
			.filter( Boolean )
			.join( ', ' );
	}

	if ( isFileUploadField( value ) ) {
		const { files = [] } = value as { files?: FileItem[] };

		if ( files.length === 0 ) {
			return '';
		}

		if ( files.length === 1 ) {
			return files[ 0 ]?.name ?? '';
		}

		return sprintf(
			/* translators: %d: number of files uploaded in a single form field. */
			_n( '%d file', '%d files', files.length, 'jetpack-forms' ),
			files.length
		);
	}

	if ( Array.isArray( value ) ) {
		return value
			.map( entry => ( entry === null || entry === undefined ? '' : String( entry ) ) )
			.filter( Boolean )
			.join( ', ' );
	}

	// Files and image selects are the only object values with a text form.
	if ( typeof value === 'object' ) {
		return '';
	}

	return String( value );
};

/**
 * Reads one field off a response, whatever shape the response arrived in.
 *
 * A response stored with form field ids is matched on its id and nothing else. If it
 * carries no field with that id then the field is genuinely absent from it, and falling
 * back to a positional key would read whichever field now occupies that slot — the answer
 * would appear under the wrong header. Only a response predating form field ids is
 * matched the looser ways: first on its own key, then on its label.
 *
 * @param response - The form response.
 * @param column   - The column being read.
 * @return           The field, or undefined when this response has no such field.
 */
export const getResponseField = (
	response: FormResponse,
	column: ResponseFieldColumn
): ResponseField | undefined => {
	const index = getFieldIndex( response );

	if ( column.fieldId && index.hasFieldIds ) {
		return index.byFieldId.get( column.fieldId );
	}

	return (
		( column.key ? index.byKey.get( column.key ) : undefined ) ??
		index.byLabel.get( normalizeLabel( column.label ) )
	);
};

/**
 * Reads one field's value off a response, as display text.
 *
 * @param response - The form response.
 * @param column   - The column being read.
 * @return           The value as text, or an empty string.
 */
export const getResponseFieldValue = (
	response: FormResponse,
	column: ResponseFieldColumn
): string => decodeEntities( getFieldText( getResponseField( response, column ) ) ).trim();

/**
 * The link a field's value should open, when it is the kind of value worth acting on.
 *
 * Mirrors the response inspector: an address opens a mail client, a number dials, and a
 * web address opens in a new tab. A value that does not look like its type — an "email"
 * that is not one, a "website" with no scheme — stays plain text there and here.
 *
 * @param type  - The form field type.
 * @param value - The value as display text.
 * @return        The href and how to open it, or null when the value is plain text.
 */
export const getFieldLink = (
	type: FieldType,
	value: string
): { href: string; openInNewTab: boolean } | null => {
	if ( type === 'email' && EMAIL_REGEX.test( value ) ) {
		return { href: `mailto:${ value }`, openInNewTab: false };
	}

	if ( type === 'telephone' || type === 'phone' ) {
		return { href: `tel:${ value.replace( /\s+/g, '' ) }`, openInNewTab: false };
	}

	if ( type === 'url' && /^https?:\/\//.test( value ) ) {
		return { href: value, openInNewTab: true };
	}

	return null;
};

/** A narrow screen shows the title column and the actions column, nothing else. */
const NO_COLUMNS: string[] = [];

/**
 * The view to hand DataViews.
 *
 * A table that scrolls sideways is no use on a phone, so a narrow screen drops
 * every column but the response and its actions. The caller's own view is left
 * untouched, so widening the window restores the columns the user had chosen.
 *
 * @param view     - The stage's view state.
 * @param isMobile - Whether the viewport is below the table's usable width.
 * @param knownIds - Every column DataViews has a field for. Omitted, nothing is withheld.
 * @return           The view to render with.
 */
export const getResponseTableView = (
	view: View,
	isMobile: boolean,
	knownIds?: Set< string >
): View => {
	if ( isMobile ) {
		return { ...view, fields: NO_COLUMNS };
	}

	if ( ! knownIds ) {
		return view;
	}

	/*
	 * Only columns DataViews has a field for, and each of them once.
	 *
	 * A restored column choice is the user's, not a description of the form as it stands
	 * now: it can name a field since deleted, or one whose responses have not loaded yet.
	 * DataViews renders a cell for every id it is given and skips the ones it cannot
	 * resolve, which leaves a blank column with no header menu — and, because the
	 * properties panel lists the fields it knows rather than the columns on screen, no way
	 * for the user to take it off again.
	 *
	 * The unresolved ids stay in the caller's own view, so a column whose responses simply
	 * have not arrived yet keeps its place and reappears there. `keepColumnChoice` puts
	 * them back when DataViews hands the view over.
	 */
	const fields = ( view.fields || [] ).filter(
		( id, index, all ) => knownIds.has( id ) && all.indexOf( id ) === index
	);

	return fields.length === ( view.fields || [] ).length ? view : { ...view, fields };
};

/**
 * The view to persist when DataViews reports a change.
 *
 * On a narrow screen DataViews is working from a collapsed column set, so a sort
 * or search there would otherwise write that empty set back over the user's real
 * choice of columns.
 *
 * @param incomingView - The view DataViews handed back.
 * @param currentView  - The stage's own view state.
 * @param isMobile     - Whether the viewport is below the table's usable width.
 * @param knownIds     - Every column DataViews has a field for. Omitted, nothing is put back.
 * @return               The view to store.
 */
export const keepColumnChoice = (
	incomingView: View,
	currentView: View,
	isMobile: boolean,
	knownIds?: Set< string >
): View => {
	if ( isMobile ) {
		return { ...incomingView, fields: currentView.fields };
	}

	if ( ! knownIds ) {
		return incomingView;
	}

	/*
	 * Put back the columns DataViews was never shown.
	 *
	 * `getResponseTableView` withholds ids DataViews has no field for, so it cannot report
	 * them back — and taking its answer at face value would quietly drop a column the user
	 * chose, just because the responses carrying it had not loaded yet. Each withheld id
	 * returns after the column it used to follow, so the user's order survives.
	 */
	const withheld = ( currentView.fields || [] ).filter( id => ! knownIds.has( id ) );

	if ( withheld.length === 0 ) {
		return incomingView;
	}

	const previous = currentView.fields || [];
	const fields = [ ...( incomingView.fields || [] ) ];

	for ( const id of withheld ) {
		const predecessor = previous
			.slice( 0, previous.indexOf( id ) )
			.filter( candidate => knownIds.has( candidate ) )
			.pop();
		const at = predecessor ? fields.indexOf( predecessor ) + 1 : 0;

		fields.splice( at, 0, id );
	}

	return { ...incomingView, fields };
};

/**
 * Whether two views show the same columns, in the same order.
 *
 * The stage saves the user's column choice from the callback DataViews reports *every*
 * change through — sorting, searching, paging — so it needs to tell a change of columns
 * from everything else.
 *
 * @param fields         - The columns after the change.
 * @param previousFields - The columns before it.
 * @return                 Whether the two are the same choice.
 */
export const isSameColumnChoice = ( fields?: string[], previousFields?: string[] ): boolean => {
	const next = fields || [];
	const previous = previousFields || [];

	return next.length === previous.length && next.every( ( id, index ) => id === previous[ index ] );
};

/**
 * The modifier that turns on the frozen leading columns, when they apply.
 *
 * Freezing only makes sense once answers have widened the table past the
 * viewport, and only holds if the columns being frozen are the ones the
 * stylesheet assumes: the selection checkbox and the title. DataViews drops the
 * title column when the user turns it off, which would freeze an answer column
 * in its place.
 *
 * @param columns  - The answer columns on screen.
 * @param view     - The stage's view state.
 * @param isMobile - Whether the viewport is below the table's usable width.
 * @return           The class name, or undefined when the columns must not freeze.
 */
export const getFrozenColumnsClassName = (
	columns: ResponseFieldColumn[],
	view: View,
	isMobile: boolean
): string | undefined =>
	! isMobile && columns.length > 0 && view.titleField && view.showTitle !== false
		? 'has-field-columns'
		: undefined;

/**
 * Turns column descriptors into DataViews field definitions.
 *
 * @param columns - The column descriptors.
 * @return          DataViews fields, one per form field.
 */
export const buildResponseFieldColumns = (
	columns: ResponseFieldColumn[]
): Field< FormResponse >[] =>
	columns.map( column => ( {
		id: column.id,
		label: column.label,
		// The responses query only understands the built-in fields, so sorting on an
		// answer would silently do nothing.
		enableSorting: false,
		getValue: ( { item }: { item: FormResponse } ) => getResponseFieldValue( item, column ),
		render: ( { item }: { item: FormResponse } ) => {
			const value = getResponseFieldValue( item, column );

			if ( ! value ) {
				/*
				 * Visually hidden text rather than an `aria-label`: the span carries no
				 * role, and ARIA forbids naming a generic element, so the label would go
				 * unannounced. `FieldRating` names its icons the same way.
				 */
				return (
					<span className="jp-forms__inbox__field-column is-empty">
						<VisuallyHidden as="span">{ NO_ANSWER_LABEL }</VisuallyHidden>
						<span aria-hidden="true">&mdash;</span>
					</span>
				);
			}

			// Ratings read as icons here just as they do in the response inspector;
			// "4/5" in a table cell is meaningless at a glance.
			if ( column.type === 'rating' ) {
				return (
					<span className="jp-forms__inbox__field-column is-rating">
						<FieldRating value={ value } />
					</span>
				);
			}

			// Answers picked from a fixed set of choices are badges, as in the inspector.
			// Multi-select keeps one badge per choice rather than a comma-joined string.
			const rawValue = getResponseField( item, column )?.value;

			if ( column.type === 'checkbox-multiple' && Array.isArray( rawValue ) ) {
				return (
					<Stack
						direction="row"
						gap="xs"
						align="center"
						className="jp-forms__inbox__field-column-badges"
					>
						{ rawValue.map( ( choice, index ) => (
							<Badge intent="draft" key={ index }>
								{ decodeEntities( String( choice ) ) }
							</Badge>
						) ) }
					</Stack>
				);
			}

			if ( BADGED_VALUE_FIELDS.includes( column.type ) ) {
				return (
					<Stack
						direction="row"
						gap="xs"
						align="center"
						className="jp-forms__inbox__field-column-badges"
						title={ value }
					>
						<Badge intent="draft">{ value }</Badge>
					</Stack>
				);
			}

			// An address, number or web address in a table is worth acting on, so make it
			// actionable.
			// The inspector's own FieldEmail/FieldPhone are deliberately not reused here:
			// they add a copy button and an async country-code lookup per value, which is
			// the right weight for one open response and the wrong weight for every row.
			const link = getFieldLink( column.type, value );

			if ( link ) {
				return (
					<span className="jp-forms__inbox__field-column" title={ value }>
						<Link
							href={ link.href }
							openInNewTab={ link.openInNewTab }
							// The value came from a form submission, and `Link` sets
							// `target` without a `rel` of its own.
							rel={ link.openInNewTab ? 'noopener noreferrer' : undefined }
						>
							{ value }
						</Link>
					</span>
				);
			}

			return (
				<span className="jp-forms__inbox__field-column" title={ value }>
					{ value }
				</span>
			);
		},
	} ) );
