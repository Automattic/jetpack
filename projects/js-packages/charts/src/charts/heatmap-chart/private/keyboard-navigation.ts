export type CellPosition = { column: number; row: number };

export type NavigationKey =
	| 'ArrowLeft'
	| 'ArrowRight'
	| 'ArrowUp'
	| 'ArrowDown'
	| 'PageUp'
	| 'PageDown';

/** A run of columns read as one page in calendar navigation; `end` is exclusive. */
export type CellBlock = { start: number; end: number };

export type NavigableGrid = {
	columns: number;
	rows: number;
	/** Whether the slot holds nothing to select (hidden or placeholder). */
	isInert: ( column: number, row: number ) => boolean;
};

const ARROW_KEYS = [ 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown' ];
const PAGE_KEYS = [ 'PageUp', 'PageDown' ];

export const isNavigationKey = ( key: string, mode: 'grid' | 'calendar' ): key is NavigationKey =>
	ARROW_KEYS.includes( key ) || ( mode === 'calendar' && PAGE_KEYS.includes( key ) );

const inGrid = ( grid: NavigableGrid, { column, row }: CellPosition ) =>
	column >= 0 && column < grid.columns && row >= 0 && row < grid.rows;

const firstSelectable = ( grid: NavigableGrid, cells: CellPosition[] ) =>
	cells.find( cell => inGrid( grid, cell ) && ! grid.isInert( cell.column, cell.row ) );

/**
 * Column-major scan for the first selectable cell.
 *
 * @param grid - The grid.
 * @return The cell, or undefined when every slot is inert.
 */
export const firstGridCell = ( grid: NavigableGrid ): CellPosition | undefined => {
	for ( let column = 0; column < grid.columns; column++ ) {
		for ( let row = 0; row < grid.rows; row++ ) {
			if ( ! grid.isInert( column, row ) ) {
				return { column, row };
			}
		}
	}
	return undefined;
};

/**
 * Steps across the grid in the key's direction, past inert slots, staying put at the edge.
 *
 * @param grid - The grid.
 * @param from - The selected cell.
 * @param key  - The arrow key.
 * @return The next cell, or undefined to keep the selection.
 */
export const stepGridCell = (
	grid: NavigableGrid,
	from: CellPosition,
	key: NavigationKey
): CellPosition | undefined => {
	const steps: Partial< Record< NavigationKey, [ number, number ] > > = {
		ArrowRight: [ 1, 0 ],
		ArrowLeft: [ -1, 0 ],
		ArrowDown: [ 0, 1 ],
		ArrowUp: [ 0, -1 ],
	};
	const step = steps[ key ];
	if ( ! step ) {
		return undefined;
	}
	const [ stepColumn, stepRow ] = step;

	let cell = from;
	do {
		cell = { column: cell.column + stepColumn, row: cell.row + stepRow };
	} while ( inGrid( grid, cell ) && grid.isInert( cell.column, cell.row ) );

	return inGrid( grid, cell ) ? cell : undefined;
};

/**
 * Every slot of the blocks in reading order: block by block, each a row at a time.
 *
 * @param grid   - The grid.
 * @param blocks - The blocks, left to right.
 * @return The slots in order.
 */
const readingOrder = ( grid: NavigableGrid, blocks: CellBlock[] ): CellPosition[] =>
	blocks.flatMap( block =>
		Array.from( { length: grid.rows }, ( _row, row ) =>
			Array.from( { length: block.end - block.start }, ( _offset, offset ) => ( {
				column: block.start + offset,
				row,
			} ) )
		).flat()
	);

const blockOf = ( blocks: CellBlock[], column: number ) =>
	blocks.findIndex( block => column >= block.start && column < block.end );

/**
 * The slots after a cell down its column (or before it, going up), continuing at the
 * same column offset of each following block.
 *
 * @param grid      - The grid.
 * @param blocks    - The blocks, left to right.
 * @param from      - The selected cell.
 * @param direction - 1 downwards, -1 upwards.
 * @return The slots in order.
 */
const columnOrderFrom = (
	grid: NavigableGrid,
	blocks: CellBlock[],
	from: CellPosition,
	direction: 1 | -1
): CellPosition[] => {
	const blockIndex = blockOf( blocks, from.column );
	const offset = from.column - blocks[ blockIndex ].start;
	const cells: CellPosition[] = [];
	const pushRows = ( column: number, startRow: number ) => {
		for ( let row = startRow; row >= 0 && row < grid.rows; row += direction ) {
			cells.push( { column, row } );
		}
	};

	pushRows( from.column, from.row + direction );
	for (
		let index = blockIndex + direction;
		index >= 0 && index < blocks.length;
		index += direction
	) {
		const column = blocks[ index ].start + offset;
		if ( column < blocks[ index ].end ) {
			pushRows( column, direction === 1 ? 0 : grid.rows - 1 );
		}
	}
	return cells;
};

/**
 * The first selectable cell in calendar reading order.
 *
 * @param grid   - The grid.
 * @param blocks - The blocks, left to right.
 * @return The cell, or undefined when every slot is inert.
 */
export const firstCalendarCell = ( grid: NavigableGrid, blocks: CellBlock[] ) =>
	firstSelectable( grid, readingOrder( grid, blocks ) );

/**
 * Steps through the blocks as pages of a calendar: Left/Right by one slot in reading
 * order, Up/Down by one row (into the neighbouring block past the edge), Page Up/Down
 * to the same slot of the neighbouring block or its nearest selectable cell.
 *
 * @param grid   - The grid.
 * @param blocks - The blocks, left to right.
 * @param from   - The selected cell.
 * @param key    - The navigation key.
 * @return The next cell, or undefined to keep the selection.
 */
export const stepCalendarCell = (
	grid: NavigableGrid,
	blocks: CellBlock[],
	from: CellPosition,
	key: NavigationKey
): CellPosition | undefined => {
	if ( key === 'ArrowRight' || key === 'ArrowLeft' ) {
		const order = readingOrder( grid, blocks );
		const index = order.findIndex( cell => cell.column === from.column && cell.row === from.row );
		const ahead =
			key === 'ArrowRight' ? order.slice( index + 1 ) : order.slice( 0, index ).reverse();
		return firstSelectable( grid, ahead );
	}

	if ( key === 'ArrowDown' || key === 'ArrowUp' ) {
		return firstSelectable(
			grid,
			columnOrderFrom( grid, blocks, from, key === 'ArrowDown' ? 1 : -1 )
		);
	}

	const blockIndex = blockOf( blocks, from.column );
	const target = blocks[ blockIndex + ( key === 'PageDown' ? 1 : -1 ) ];
	if ( ! target ) {
		return undefined;
	}
	const same = {
		column: target.start + ( from.column - blocks[ blockIndex ].start ),
		row: from.row,
	};
	const page = readingOrder( grid, [ target ] );
	const at = page.findIndex(
		cell => cell.row > same.row || ( cell.row === same.row && cell.column >= same.column )
	);
	const after = at === -1 ? [] : page.slice( at );
	const before = ( at === -1 ? page : page.slice( 0, at ) ).reverse();
	return firstSelectable( grid, after ) ?? firstSelectable( grid, before );
};
