/**
 * A single editable chapter row. `id` is workspace-local and stable across
 * sorting, so React keys and validation errors survive reorders.
 */
export type ChapterRow = {
	id: number;
	seconds: number;
	title: string;
};

export type ChapterWorkspaceState = {
	rows: ChapterRow[];
	/* Signature of the last seeded/saved rows, to tell edits from viewing. */
	baseline: string;
	nextId: number;
	/* Whether the workspace was seeded with chapters, so emptying it counts as a removal. */
	hadChapters: boolean;
};

export type ChapterWorkspaceAction =
	| { type: 'SEED'; chapters: Array< { seconds: number; title: string } > }
	| { type: 'ADD_ROW'; seconds: number }
	| { type: 'SET_TIME'; id: number; seconds: number }
	| { type: 'SET_TITLE'; id: number; title: string }
	| { type: 'REMOVE_ROW'; id: number }
	| { type: 'MARK_SAVED' };

export type ChapterValidationError =
	| { code: 'start-at-zero' }
	| { code: 'min-count' }
	| { code: 'gap'; rowId: number }
	| { code: 'empty-title'; rowId: number };

const MIN_CHAPTER_COUNT = 3;
const MIN_CHAPTER_GAP_SECONDS = 10;

const sortRows = ( rows: ChapterRow[] ): ChapterRow[] =>
	[ ...rows ].sort( ( a, b ) => a.seconds - b.seconds );

const rowsSignature = ( rows: ChapterRow[] ): string =>
	rows.map( row => `${ row.seconds } ${ row.title }` ).join( '\n' );

export const initialChapterWorkspaceState: ChapterWorkspaceState = {
	rows: [],
	baseline: '',
	nextId: 1,
	hadChapters: false,
};

/**
 * Reduce a chapter workspace action into the next state. Rows stay sorted by
 * start time after every action.
 *
 * @param {ChapterWorkspaceState}  state  - Current state.
 * @param {ChapterWorkspaceAction} action - Action to apply.
 * @return {ChapterWorkspaceState} The next state.
 */
export function chapterWorkspaceReducer(
	state: ChapterWorkspaceState,
	action: ChapterWorkspaceAction
): ChapterWorkspaceState {
	switch ( action.type ) {
		case 'SEED': {
			const rows = sortRows(
				action.chapters.map( ( chapter, index ) => ( {
					id: index + 1,
					seconds: chapter.seconds,
					title: chapter.title,
				} ) )
			);
			return {
				rows,
				baseline: rowsSignature( rows ),
				nextId: rows.length + 1,
				hadChapters: rows.length > 0,
			};
		}

		case 'ADD_ROW': {
			const added: ChapterRow[] = [ { id: state.nextId, seconds: action.seconds, title: '' } ];
			let nextId = state.nextId + 1;
			// The first chapter must start at 0:00; create that row on first add.
			if ( ! state.rows.length && action.seconds !== 0 ) {
				added.unshift( { id: nextId, seconds: 0, title: '' } );
				nextId += 1;
			}
			return { ...state, rows: sortRows( [ ...state.rows, ...added ] ), nextId };
		}

		case 'SET_TIME':
			return {
				...state,
				rows: sortRows(
					state.rows.map( row =>
						row.id === action.id ? { ...row, seconds: action.seconds } : row
					)
				),
			};

		case 'SET_TITLE':
			return {
				...state,
				rows: state.rows.map( row =>
					row.id === action.id ? { ...row, title: action.title } : row
				),
			};

		case 'REMOVE_ROW':
			return { ...state, rows: state.rows.filter( row => row.id !== action.id ) };

		case 'MARK_SAVED':
			return {
				...state,
				baseline: rowsSignature( state.rows ),
				hadChapters: state.rows.length > 0,
			};

		default:
			return state;
	}
}

/**
 * Validation errors for the current rows against the player's chapter rules.
 * An empty list is not an error state — it means "no chapters".
 *
 * @param {ChapterRow[]} rows - Rows sorted by start time.
 * @return {ChapterValidationError[]} The errors, empty when the set is valid.
 */
export function getChapterValidationErrors( rows: ChapterRow[] ): ChapterValidationError[] {
	if ( ! rows.length ) {
		return [];
	}

	const errors: ChapterValidationError[] = [];

	if ( rows[ 0 ].seconds !== 0 ) {
		errors.push( { code: 'start-at-zero' } );
	}

	if ( rows.length < MIN_CHAPTER_COUNT ) {
		errors.push( { code: 'min-count' } );
	}

	for ( let i = 1; i < rows.length; i++ ) {
		if ( rows[ i ].seconds - rows[ i - 1 ].seconds < MIN_CHAPTER_GAP_SECONDS ) {
			errors.push( { code: 'gap', rowId: rows[ i ].id } );
		}
	}

	for ( const row of rows ) {
		if ( ! row.title.trim() ) {
			errors.push( { code: 'empty-title', rowId: row.id } );
		}
	}

	return errors;
}

/**
 * Whether the workspace differs from its last seeded/saved baseline.
 *
 * @param {ChapterWorkspaceState} state - Current state.
 * @return {boolean} Whether there are unsaved edits.
 */
export function hasUnsavedChapterEdits( state: ChapterWorkspaceState ): boolean {
	return rowsSignature( state.rows ) !== state.baseline;
}

/**
 * Whether Save should be enabled: unsaved edits that are either a valid
 * chapter set or an emptied workspace that previously had chapters.
 *
 * @param {ChapterWorkspaceState} state - Current state.
 * @return {boolean} Whether saving is allowed.
 */
export function canSaveChapters( state: ChapterWorkspaceState ): boolean {
	if ( ! hasUnsavedChapterEdits( state ) ) {
		return false;
	}

	if ( ! state.rows.length ) {
		return state.hadChapters;
	}

	return getChapterValidationErrors( state.rows ).length === 0;
}
