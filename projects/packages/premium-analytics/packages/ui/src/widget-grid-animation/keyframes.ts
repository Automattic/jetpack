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

/**
 * What a tile shows under its icon once it has room: a line chart, two rows
 * of list placeholder, or a donut placeholder above those rows.
 */
export type WidgetGridTileContent = 'chart' | 'rows' | 'donut';

export type WidgetGridTile = WidgetGridRect & {
	/** Omitted, the tile is its icon alone. */
	content?: WidgetGridTileContent;
};

export type WidgetGridKeyframe = {
	tiles: Record< WidgetGridTileId, WidgetGridTile >;

	/** Pause on this frame before the next tween starts, in ms. Wins over the component prop. */
	hold?: number;

	/** Length of the tween into this frame, in ms. Wins over the component prop. */
	duration?: number;
};

const tile = (
	x: number,
	y: number,
	width: number,
	height: number,
	content?: WidgetGridTileContent
): WidgetGridTile => ( content ? { x, y, width, height, content } : { x, y, width, height } );

// Padding plus icon: the tile collapses to the icon and nothing else.
const collapsed = ( x: number, y: number ): WidgetGridTile => tile( x, y, 56, 56 );

/**
 * The onboarding storyboard: tiles resize, move and swap to show what the
 * dashboard lets a reader do. Geometry is the Figma "animation flow" keyframes
 * verbatim, centering included; the placeholders each tile shows follow the
 * prototype video, which is richer than the Figma frames there.
 * `WIDGET_GRID_KEYFRAME_CAPTIONS` says what each keyframe changes.
 */
export const WIDGET_GRID_KEYFRAMES: WidgetGridKeyframe[] = [
	{
		tiles: {
			chart: collapsed( 138, 81 ),
			people: collapsed( 138, 149 ),
			pages: collapsed( 206, 149 ),
		},
	},
	{
		tiles: {
			chart: tile( 66, 40, 268, 102 ),
			people: collapsed( 66, 154 ),
			pages: collapsed( 134, 154 ),
		},
	},
	{
		tiles: {
			chart: tile( 66, 40, 268, 102, 'chart' ),
			people: collapsed( 66, 154 ),
			pages: collapsed( 134, 154 ),
		},
	},
	{
		tiles: {
			chart: tile( 66, 40, 268, 102, 'chart' ),
			people: tile( 66, 154, 128, 102, 'rows' ),
			pages: collapsed( 206, 154 ),
		},
	},
	{
		tiles: {
			chart: tile( 66, 40, 268, 102, 'chart' ),
			people: tile( 66, 154, 128, 102, 'rows' ),
			pages: tile( 206, 154, 128, 102, 'rows' ),
		},
	},
	{
		tiles: {
			chart: tile( 66, 40, 128, 102, 'chart' ),
			people: tile( 66, 154, 128, 102, 'rows' ),
			pages: tile( 206, 154, 128, 102, 'rows' ),
		},
	},
	{
		tiles: {
			chart: tile( 66, 40, 128, 102, 'chart' ),
			people: tile( 66, 154, 128, 102, 'rows' ),
			pages: tile( 206, 40, 128, 216, 'donut' ),
		},
	},
	{
		tiles: {
			chart: tile( 206, 40, 128, 102, 'chart' ),
			people: tile( 206, 154, 128, 102, 'rows' ),
			pages: tile( 66, 40, 128, 216, 'donut' ),
		},
	},
	{
		tiles: {
			chart: tile( 206, 40, 128, 102, 'chart' ),
			people: collapsed( 206, 154 ),
			pages: tile( 66, 40, 128, 216, 'donut' ),
		},
	},
	{
		tiles: {
			chart: tile( 170, 58, 128, 102, 'chart' ),
			people: collapsed( 170, 172 ),
			pages: collapsed( 102, 58 ),
		},
	},
	{
		tiles: {
			chart: collapsed( 206, 81 ),
			people: collapsed( 206, 149 ),
			pages: collapsed( 138, 81 ),
		},
	},
];

/**
 * What changes on the way into each keyframe, after the designer's captions
 * on the Figma frames. Read by the stories; the app never imports it.
 */
export const WIDGET_GRID_KEYFRAME_CAPTIONS: readonly string[] = [
	'The start: three tiles collapsed to their icons.',
	'The chart tile grows wide.',
	'The chart wipes in, left to right, inside the wide tile.',
	'The people tile grows, shows its rows and pushes the pages tile along; the group stays centered.',
	'The pages tile grows to match and shows its rows.',
	'The chart tile shrinks, and the chart squeezes with it.',
	'The pages tile grows taller to fill its column, and a donut placeholder fills the room.',
	'The pages tile swaps sides with the chart and people tiles.',
	'The people tile shrinks back to its icon.',
	'The pages tile shrinks back too; the group centers again.',
	'The chart tile shrinks and hides the chart. The loop then reorders the tiles back to the start.',
];

/** The fullest composition: what a reader who prefers reduced motion gets, still. */
export const WIDGET_GRID_STATIC_FRAME = 4;
