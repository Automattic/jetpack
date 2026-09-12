/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { readKnownAnswerIds } from '../response-column-preferences.ts';
import {
	getResponseFieldColumns,
	mergeResponseFieldColumns,
	type ResponseFieldColumn,
} from '../response-field-columns.tsx';
/**
 * Types
 */
import type { FormResponse } from '../../types/index.ts';
import type { View } from '@wordpress/dataviews';

const EMPTY_COLUMNS: ResponseFieldColumn[] = [];

type SetView = ( updater: ( previousView: View ) => View ) => void;

type UseResponseFieldColumnsArgs = {
	/** The form whose responses are on screen, or null on a view that spans every form. */
	formId: number | null;
	/** The responses currently loaded. */
	records: FormResponse[];
	/** The DataViews view setter. Must accept a functional updater. */
	setView: SetView;
};

/**
 * Returns the view's `fields` with `newIds` slotted in after the answer columns.
 *
 * Answers are always inserted directly after Date, so Date can never end up behind
 * one: "one past the last Date-or-answer column" places them correctly whether this
 * is the first batch or a later one.
 *
 * @param previousView - The view to update.
 * @param newIds       - The column ids to add.
 * @param answerIds    - Every answer column id known so far.
 * @return               The updated view.
 */
const showColumns = ( previousView: View, newIds: string[], answerIds: Set< string > ): View => {
	const previousFields = previousView.fields || [];
	const insertAt =
		previousFields.reduce(
			( last, id, index ) => ( id === 'date' || answerIds.has( id ) ? index : last ),
			-1
		) + 1;

	// A restored choice can already name a column that is only now being discovered, and
	// inserting it a second time would render it twice.
	const additions = newIds.filter( id => ! previousFields.includes( id ) );

	if ( additions.length === 0 ) {
		return previousView;
	}

	return {
		...previousView,
		fields: [
			...previousFields.slice( 0, insertAt ),
			...additions,
			...previousFields.slice( insertAt ),
		],
	};
};

/**
 * Turns a form's own fields into DataViews columns on its responses view.
 *
 * Columns are discovered from the responses rather than declared up front, so they
 * cannot live in the default view. Three behaviors follow from that, and this hook
 * owns all three:
 *
 * A column appears as soon as a response carrying that field loads, but only the
 * first time. Columns accumulate for as long as the form is open, so one never
 * disappears mid-session — and because a known field is never re-offered, a column
 * the user has hidden stays hidden.
 *
 * Switching forms starts over: the previous form's columns are dropped from the view
 * instead of lingering there empty. The stage does not remount between forms, so
 * nothing else would clear them. A view that spans every form gets no answer columns
 * at all; those forms share no field set.
 *
 * @param args         - Hook arguments.
 * @param args.formId  - The form on screen, or null on a view spanning every form.
 * @param args.records - The responses currently loaded.
 * @param args.setView - The DataViews view setter.
 * @return               The answer columns to render, in first-seen order.
 */
export default function useResponseFieldColumns( {
	formId,
	records,
	setView,
}: UseResponseFieldColumnsArgs ): ResponseFieldColumn[] {
	const [ columns, setColumns ] = useState< ResponseFieldColumn[] >( EMPTY_COLUMNS );
	// The accumulated columns, read and written without re-running this effect.
	// `formId` starts undefined rather than null so that the first run always counts as a
	// change of form — otherwise the view spanning every form would never restore.
	const seen = useRef< {
		formId: number | null | undefined;
		columns: ResponseFieldColumn[];
		restoredIds: Set< string >;
	} >( {
		formId: undefined,
		columns: EMPTY_COLUMNS,
		restoredIds: new Set(),
	} );

	useEffect( () => {
		const previous = seen.current;

		if ( previous.formId !== formId ) {
			const staleIds = new Set( previous.columns.map( column => column.id ) );

			seen.current = {
				formId,
				columns: EMPTY_COLUMNS,
				// The answer columns that were on offer when this form's view was last
				// changed. Anything in here has already been offered to the user once, so
				// it must not be re-added — that is what keeps a hidden column hidden.
				restoredIds: new Set( readKnownAnswerIds( formId ) ?? [] ),
			};
			setColumns( EMPTY_COLUMNS );

			// Which columns are shown is restored by `useView` before this runs, so the
			// only thing left to fix up is the outgoing form's answer columns: they name
			// fields the incoming form does not have.
			if ( staleIds.size > 0 ) {
				setView( previousView => ( {
					...previousView,
					fields: ( previousView.fields || [] ).filter( id => ! staleIds.has( id ) ),
				} ) );
			}
		}

		if ( formId === null ) {
			return;
		}

		const known = seen.current.columns;
		// Only this form's responses may contribute columns. Switching forms re-runs
		// this effect one render before the new responses land, and without the filter
		// the outgoing form's fields would be rediscovered from the stale records and
		// immediately re-added to the view the reset above just cleared.
		const ownRecords = ( records || [] ).filter( record => record.form_id === formId );
		const merged = mergeResponseFieldColumns( known, getResponseFieldColumns( ownRecords ) );

		if ( merged === known ) {
			return;
		}

		// mergeResponseFieldColumns only ever appends, so the tail is what is new. A
		// column the user has already been offered is not new, however freshly it was
		// just rediscovered — restoring a choice means not re-offering what it excluded.
		const restoredIds = seen.current.restoredIds;
		const newIds = merged
			.slice( known.length )
			.map( column => column.id )
			.filter( id => ! restoredIds.has( id ) );
		const answerIds = new Set( merged.map( column => column.id ) );

		seen.current = { formId, columns: merged, restoredIds };
		setColumns( merged );

		if ( newIds.length > 0 ) {
			setView( previousView => showColumns( previousView, newIds, answerIds ) );
		}
	}, [ formId, records, setView ] );

	return columns;
}
