/**
 * External dependencies
 */
import { VisuallyHidden } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Link } from '@wordpress/ui';
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
	/** The form field key the column reads from. */
	key: string;
	/** The column header. */
	label: string;
	/** The form field type, so the cell can render the way the inspector does. */
	type: FieldType;
};

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
 * Per-response key lookup, so a row's fields are walked once rather than once per cell.
 *
 * Keyed on the record object, so the map holds for as long as a render pass reuses the
 * same records. `useInboxData` rebuilds every record whenever it recomputes, so a refetch
 * simply misses and rebuilds; entries fall away with the records themselves, and there is
 * nothing to invalidate.
 */
const fieldsByKey = new WeakMap< FormResponse, Map< string, ResponseField > >();

const getFieldMap = ( response: FormResponse ): Map< string, ResponseField > => {
	let map = fieldsByKey.get( response );

	if ( ! map ) {
		map = new Map( getFieldList( response ).map( field => [ String( field.key ), field ] ) );
		fieldsByKey.set( response, map );
	}

	return map;
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

	for ( const response of responses ?? [] ) {
		for ( const field of getFieldList( response ) ) {
			const key = String( field.key ?? '' );

			if ( ! key || columns.has( key ) ) {
				continue;
			}

			const label = decodeEntities( String( field.label || key ) );

			columns.set( key, {
				id: `${ COLUMN_ID_PREFIX }${ key }`,
				key,
				label,
				// Legacy responses carry no type (or a useless 'basic'); the inspector
				// infers one from the label in that case, so match it.
				type:
					field.type && field.type !== 'basic'
						? ( field.type as FieldType )
						: inferFieldTypeFromLabel( label ) ?? 'text',
			} );
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
	const known = new Set( previous.map( column => column.key ) );
	const additions = discovered.filter( column => ! known.has( column.key ) );

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
 * @param response - The form response.
 * @param key      - The form field key.
 * @return           The field, or undefined when this response has no such field.
 */
export const getResponseField = (
	response: FormResponse,
	key: string
): ResponseField | undefined => getFieldMap( response ).get( key );

/**
 * Reads one field's value off a response, as display text.
 *
 * @param response - The form response.
 * @param key      - The form field key.
 * @return           The value as text, or an empty string.
 */
export const getResponseFieldValue = ( response: FormResponse, key: string ): string => {
	return decodeEntities( getFieldText( getFieldMap( response ).get( key ) ) ).trim();
};

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
 * @return           The view to render with.
 */
export const getResponseTableView = ( view: View, isMobile: boolean ): View =>
	isMobile ? { ...view, fields: NO_COLUMNS } : view;

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
 * @return               The view to store.
 */
export const keepColumnChoice = (
	incomingView: View,
	currentView: View,
	isMobile: boolean
): View => ( isMobile ? { ...incomingView, fields: currentView.fields } : incomingView );

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
		getValue: ( { item }: { item: FormResponse } ) => getResponseFieldValue( item, column.key ),
		render: ( { item }: { item: FormResponse } ) => {
			const value = getResponseFieldValue( item, column.key );

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
			const rawValue = getResponseField( item, column.key )?.value;

			if ( column.type === 'checkbox-multiple' && Array.isArray( rawValue ) ) {
				return (
					<span className="jp-forms__inbox__field-column is-badges">
						{ rawValue.map( ( choice, index ) => (
							<Badge intent="draft" key={ index }>
								{ decodeEntities( String( choice ) ) }
							</Badge>
						) ) }
					</span>
				);
			}

			if ( BADGED_VALUE_FIELDS.includes( column.type ) ) {
				return (
					<span className="jp-forms__inbox__field-column is-badges" title={ value }>
						<Badge intent="draft">{ value }</Badge>
					</span>
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
