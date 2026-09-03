/** Design canvas the keyframes are drawn on, in px; the rendered tiles scale with it. */
export const WIDGET_GRID_CANVAS = { width: 400, height: 286 } as const;

export type WidgetGridTileId = 'chart' | 'people' | 'pages';

export const WIDGET_GRID_TILE_IDS: readonly WidgetGridTileId[] = [ 'chart', 'people', 'pages' ];

/** A tile's box on the canvas, in canvas px. */
export type WidgetGridRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type WidgetGridKeyframe = {
	tiles: Record< WidgetGridTileId, WidgetGridRect >;

	/** Shows the chart inside the chart tile; off, the tile is its icon alone. */
	chart?: boolean;

	/** Pause on this frame before the next tween starts, in ms. Wins over the component prop. */
	hold?: number;

	/** Length of the tween into this frame, in ms. Wins over the component prop. */
	duration?: number;
};

const rect = ( x: number, y: number, width: number, height: number ): WidgetGridRect => ( {
	x,
	y,
	width,
	height,
} );

// Padding plus icon: the tile collapses to the icon and nothing else.
const collapsed = ( x: number, y: number ): WidgetGridRect => rect( x, y, 56, 56 );

/**
 * The onboarding storyboard: tiles resize, move and swap to show what the
 * dashboard lets a reader do. Geometry is the Figma "animation flow" keyframes
 * verbatim, centering included; the captions are the designer's.
 */
export const WIDGET_GRID_KEYFRAMES: WidgetGridKeyframe[] = [
	// Three tiles collapsed.
	{
		tiles: {
			chart: collapsed( 138, 81 ),
			people: collapsed( 138, 149 ),
			pages: collapsed( 206, 149 ),
		},
	},
	// The chart tile grows.
	{
		tiles: {
			chart: rect( 66, 40, 268, 102 ),
			people: collapsed( 66, 154 ),
			pages: collapsed( 134, 154 ),
		},
	},
	// The chart appears inside it.
	{
		chart: true,
		tiles: {
			chart: rect( 66, 40, 268, 102 ),
			people: collapsed( 66, 154 ),
			pages: collapsed( 134, 154 ),
		},
	},
	// The people tile grows and pushes the pages tile along.
	{
		chart: true,
		tiles: {
			chart: rect( 66, 40, 268, 102 ),
			people: rect( 66, 154, 128, 102 ),
			pages: collapsed( 206, 154 ),
		},
	},
	// The pages tile grows.
	{
		chart: true,
		tiles: {
			chart: rect( 66, 40, 268, 102 ),
			people: rect( 66, 154, 128, 102 ),
			pages: rect( 206, 154, 128, 102 ),
		},
	},
	// The chart tile shrinks, and the chart with it.
	{
		chart: true,
		tiles: {
			chart: rect( 66, 40, 128, 102 ),
			people: rect( 66, 154, 128, 102 ),
			pages: rect( 206, 154, 128, 102 ),
		},
	},
	// The pages tile grows taller to fill the column.
	{
		chart: true,
		tiles: {
			chart: rect( 66, 40, 128, 102 ),
			people: rect( 66, 154, 128, 102 ),
			pages: rect( 206, 40, 128, 216 ),
		},
	},
	// The pages tile swaps sides with the other two.
	{
		chart: true,
		tiles: {
			chart: rect( 206, 40, 128, 102 ),
			people: rect( 206, 154, 128, 102 ),
			pages: rect( 66, 40, 128, 216 ),
		},
	},
	// The people tile shrinks.
	{
		chart: true,
		tiles: {
			chart: rect( 206, 40, 128, 102 ),
			people: collapsed( 206, 154 ),
			pages: rect( 66, 40, 128, 216 ),
		},
	},
	// The pages tile shrinks.
	{
		chart: true,
		tiles: {
			chart: rect( 170, 58, 128, 102 ),
			people: collapsed( 170, 172 ),
			pages: collapsed( 102, 58 ),
		},
	},
	// The chart tile shrinks and hides the chart; the loop then reorders back to the start.
	{
		tiles: {
			chart: collapsed( 206, 81 ),
			people: collapsed( 206, 149 ),
			pages: collapsed( 138, 81 ),
		},
	},
];

/** The fullest composition: what a reader who prefers reduced motion gets, still. */
export const WIDGET_GRID_STATIC_FRAME = 4;
