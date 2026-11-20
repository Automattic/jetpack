import type { TemplatePlacement } from '../types';
import type { JSX } from 'react';

export type PlacedBlock = 'sharing-buttons' | 'like';

// Ten lines of post content, as Newsletter's wireframes draw them.
const LINE_WIDTHS = [ 139.44, 145.32, 141.96, 143.64, 142.8, 144.48, 143.64, 139.44, 145.32, 96 ];
const LINE_GAP = 4.62;
const COLUMN_X = 74;
const TITLE_Y = 50;
const ROW_HEIGHT = 14;

/**
 * Points of a five-pointed star, the Like button's icon.
 *
 * @param cx - Centre x.
 * @param cy - Centre y.
 * @param r  - Outer radius.
 * @return SVG polygon points.
 */
function starPoints( cx: number, cy: number, r: number ): string {
	return Array.from( { length: 10 }, ( _, i ) => {
		const radius = i % 2 ? r * 0.45 : r;
		const angle = ( Math.PI / 5 ) * i - Math.PI / 2;
		return `${ cx + radius * Math.cos( angle ) },${ cy + radius * Math.sin( angle ) }`;
	} ).join( ' ' );
}

/**
 * A row of share buttons.
 *
 * @param props   - Props.
 * @param props.y - Top of the row.
 * @return Row.
 */
function SharingButtonsRow( { y }: { y: number } ): JSX.Element {
	return (
		<g>
			{ [ 0, 1, 2, 3 ].map( index => (
				<g key={ index }>
					<rect
						className="jetpack-sharing-likes__wireframe-block"
						x={ COLUMN_X + index * 18 }
						y={ y }
						width={ ROW_HEIGHT }
						height={ ROW_HEIGHT }
						rx="3"
					/>
					<circle
						className="jetpack-sharing-likes__wireframe-surface"
						cx={ COLUMN_X + index * 18 + ROW_HEIGHT / 2 }
						cy={ y + ROW_HEIGHT / 2 }
						r="3"
					/>
				</g>
			) ) }
		</g>
	);
}

/**
 * A Like button and the avatars of a few readers who liked the post.
 *
 * @param props   - Props.
 * @param props.y - Top of the row.
 * @return Row.
 */
function LikeRow( { y }: { y: number } ): JSX.Element {
	const middle = y + ROW_HEIGHT / 2;

	return (
		<g>
			<rect
				className="jetpack-sharing-likes__wireframe-button"
				x={ COLUMN_X }
				y={ y }
				width="38"
				height={ ROW_HEIGHT }
				rx="3"
			/>
			<polygon
				className="jetpack-sharing-likes__wireframe-block"
				points={ starPoints( COLUMN_X + 9, middle, 4 ) }
			/>
			<rect
				className="jetpack-sharing-likes__wireframe-block"
				x={ COLUMN_X + 16 }
				y={ middle - 1.26 }
				width="16"
				height="2.52"
				rx="1.26"
			/>
			{ [ 0, 1, 2 ].map( index => (
				<circle
					key={ index }
					className="jetpack-sharing-likes__wireframe-avatar"
					cx={ COLUMN_X + 50 + index * 9 }
					cy={ middle }
					r="6"
				/>
			) ) }
			<rect
				className="jetpack-sharing-likes__wireframe-line"
				x={ COLUMN_X + 76 }
				y={ middle - 1.26 }
				width="44"
				height="2.52"
				rx="1.26"
			/>
		</g>
	);
}

/**
 * Wireframe of a post with the block before or after its content, drawn 294×192 to fill a `CheckboxCard`.
 *
 * @param props           - Props.
 * @param props.block     - Block being placed.
 * @param props.placement - Where it goes.
 * @return Decorative SVG.
 */
export function PlacementIllustration( {
	block,
	placement,
}: {
	block: PlacedBlock;
	placement: TemplatePlacement;
} ): JSX.Element {
	const blockFirst = placement === 'before_content';
	const contentY = TITLE_Y + 16 + ( blockFirst ? ROW_HEIGHT + 12 : 0 );
	const rowY = blockFirst ? TITLE_Y + 16 : contentY + LINE_WIDTHS.length * LINE_GAP + 8;
	const Row = block === 'like' ? LikeRow : SharingButtonsRow;

	return (
		<svg
			className="jetpack-sharing-likes__wireframe"
			width="294"
			height="192"
			viewBox="0 0 294 192"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<rect
				className="jetpack-sharing-likes__wireframe-line"
				x={ COLUMN_X }
				y={ TITLE_Y }
				width="110.88"
				height="6.72"
				rx="3.36"
			/>
			{ LINE_WIDTHS.map( ( width, index ) => (
				<rect
					key={ index }
					className="jetpack-sharing-likes__wireframe-line"
					x={ COLUMN_X }
					y={ contentY + index * LINE_GAP }
					width={ width }
					height="2.52"
					rx="1.26"
				/>
			) ) }
			<Row y={ rowY } />
		</svg>
	);
}
