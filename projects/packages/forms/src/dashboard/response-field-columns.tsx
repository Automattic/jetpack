/**
 * External dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { _n, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	isCollectionFormatField,
	isFileUploadField,
	isImageSelectField,
} from './components/inspector/utils.ts';
/**
 * Types
 */
import type { FileItem, FormResponse, ResponseField } from '../types/index.ts';
import type { Field } from '@wordpress/dataviews';

/**
 * Prefix keeping generated column ids clear of the built-in ones ( 'from', 'date', 'ip', … ).
 */
const COLUMN_ID_PREFIX = 'field:';

export type ResponseFieldColumn = {
	/** The DataViews field id. */
	id: string;
	/** The form field key the column reads from. */
	key: string;
	/** The column header. */
	label: string;
};

/**
 * Tells a generated answer column apart from a built-in one.
 *
 * @param id - A DataViews field id.
 * @return     True when the id belongs to a form field column.
 */
export const isResponseFieldColumnId = ( id: string ): boolean =>
	typeof id === 'string' && id.startsWith( COLUMN_ID_PREFIX );

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

	const values = Array.isArray( fields ) ? fields : Object.values( fields );

	if ( values.length === 0 ) {
		return [];
	}

	if ( isCollectionFormatField( values[ 0 ] ) ) {
		return values as ResponseField[];
	}

	// Legacy shape: the label is the only stable identifier available.
	return Object.entries( fields ).map( ( [ label, value ] ) => ( { key: label, label, value } ) );
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

			columns.set( key, {
				id: `${ COLUMN_ID_PREFIX }${ key }`,
				key,
				label: decodeEntities( String( field.label || key ) ),
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
 * Reads one field's value off a response, as display text.
 *
 * @param response - The form response.
 * @param key      - The form field key.
 * @return           The value as text, or an empty string.
 */
export const getResponseFieldValue = ( response: FormResponse, key: string ): string => {
	const field = getFieldList( response ).find( item => String( item.key ) === key );

	return decodeEntities( getFieldText( field ) ).trim();
};

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
				return <span className="jp-forms__inbox__field-column is-empty">&mdash;</span>;
			}

			return (
				<span className="jp-forms__inbox__field-column" title={ value }>
					{ value }
				</span>
			);
		},
	} ) );
