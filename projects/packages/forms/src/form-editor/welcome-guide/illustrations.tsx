/**
 * Welcome guide illustrations
 *
 * One flat illustration per guide slide, drawn on a 312×240 canvas to match the
 * artwork region of the core welcome guide. Shapes are deliberately abstract —
 * they stand for fields, panels, and buttons rather than reproducing the real
 * editor chrome, so they don't go stale as the UI changes.
 *
 * @package
 */

import { SVG, Rect, Circle, Path, G } from '@wordpress/primitives';
import type { ReactNode } from 'react';

const WIDTH = 312;
const HEIGHT = 240;

/** Panel background — jp-green-40. */
const GREEN = '#069e08';
/** Accent used for buttons, selection, and toggles — jp-green-50. */
const GREEN_DEEP = '#008710';
/** Card surfaces. */
const CARD = '#ffffff';
/** Label bars. */
const LINE = '#dcdcde';
/** Input and chip fills. */
const FILL = '#f0f0f1';
/** Outlines and de-emphasised marks. */
const MUTED = '#c3c4c7';

/**
 * Shared canvas: a green panel that every illustration is drawn on.
 *
 * @param props          - Component props
 * @param props.children - Shapes to draw over the panel
 * @return The illustration canvas.
 */
const Canvas = ( { children }: { children: ReactNode } ) => (
	<SVG
		className="jetpack-forms-welcome-guide__illustration"
		viewBox={ `0 0 ${ WIDTH } ${ HEIGHT }` }
		width={ WIDTH }
		height={ HEIGHT }
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<Rect width={ WIDTH } height={ HEIGHT } fill={ GREEN } />
		{ children }
	</SVG>
);

/**
 * A rounded bar standing in for a text label.
 *
 * @param props        - Component props
 * @param props.x      - Left edge
 * @param props.y      - Top edge
 * @param props.width  - Bar width
 * @param props.height - Bar height, defaults to 6
 * @param props.fill   - Bar colour, defaults to the label grey
 * @return The bar.
 */
const Bar = ( {
	x,
	y,
	width,
	height = 6,
	fill = LINE,
}: {
	x: number;
	y: number;
	width: number;
	height?: number;
	fill?: string;
} ) => <Rect x={ x } y={ y } width={ width } height={ height } rx={ height / 2 } fill={ fill } />;

/**
 * Slide 1 — a form card layered over two more sheets, for "create it once,
 * then add it anywhere".
 *
 * @return The illustration.
 */
export const ReusableFormIllustration = () => (
	<Canvas>
		<Rect x={ 92 } y={ 34 } width={ 140 } height={ 150 } rx={ 8 } fill={ CARD } opacity={ 0.2 } />
		<Rect x={ 84 } y={ 42 } width={ 140 } height={ 150 } rx={ 8 } fill={ CARD } opacity={ 0.4 } />
		<Rect x={ 76 } y={ 50 } width={ 140 } height={ 150 } rx={ 8 } fill={ CARD } />
		<Bar x={ 90 } y={ 66 } width={ 44 } />
		<Rect x={ 90 } y={ 79 } width={ 112 } height={ 20 } rx={ 4 } fill={ FILL } />
		<Bar x={ 90 } y={ 109 } width={ 56 } />
		<Rect x={ 90 } y={ 122 } width={ 112 } height={ 20 } rx={ 4 } fill={ FILL } />
		<Rect x={ 152 } y={ 158 } width={ 50 } height={ 20 } rx={ 4 } fill={ GREEN_DEEP } />
	</Canvas>
);

/**
 * Slide 2 — an inserter beside a form with an open slot, for adding fields.
 *
 * @return The illustration.
 */
export const AddFieldsIllustration = () => (
	<Canvas>
		{ /* Inserter panel */ }
		<Rect x={ 28 } y={ 44 } width={ 92 } height={ 152 } rx={ 8 } fill={ CARD } />
		<Rect x={ 38 } y={ 56 } width={ 72 } height={ 12 } rx={ 6 } fill={ FILL } />
		<Rect
			x={ 38 }
			y={ 78 }
			width={ 72 }
			height={ 18 }
			rx={ 4 }
			fill={ GREEN_DEEP }
			opacity={ 0.15 }
		/>
		<Rect x={ 38 } y={ 102 } width={ 72 } height={ 18 } rx={ 4 } fill={ FILL } />
		<Rect x={ 38 } y={ 126 } width={ 72 } height={ 18 } rx={ 4 } fill={ FILL } />
		<Rect x={ 38 } y={ 150 } width={ 72 } height={ 18 } rx={ 4 } fill={ FILL } />

		{ /* Form card with an empty slot */ }
		<Rect x={ 136 } y={ 44 } width={ 148 } height={ 152 } rx={ 8 } fill={ CARD } />
		<Bar x={ 148 } y={ 60 } width={ 40 } />
		<Rect x={ 148 } y={ 71 } width={ 124 } height={ 18 } rx={ 4 } fill={ FILL } />
		<Bar x={ 148 } y={ 97 } width={ 52 } />
		<Rect x={ 148 } y={ 108 } width={ 124 } height={ 18 } rx={ 4 } fill={ FILL } />
		<Rect
			x={ 148 }
			y={ 136 }
			width={ 124 }
			height={ 34 }
			rx={ 4 }
			stroke={ GREEN_DEEP }
			strokeWidth={ 2 }
			strokeDasharray="5 4"
		/>
		<G fill={ GREEN_DEEP }>
			<Rect x={ 203 } y={ 151 } width={ 14 } height={ 3 } rx={ 1.5 } />
			<Rect x={ 208.5 } y={ 145.5 } width={ 3 } height={ 14 } rx={ 1.5 } />
		</G>
	</Canvas>
);

/**
 * Slide 3 — a selected field with its settings sidebar.
 *
 * @return The illustration.
 */
export const FieldSettingsIllustration = () => (
	<Canvas>
		{ /* Form card with one field selected */ }
		<Rect x={ 24 } y={ 48 } width={ 150 } height={ 144 } rx={ 8 } fill={ CARD } />
		<Bar x={ 36 } y={ 62 } width={ 40 } />
		<Rect x={ 36 } y={ 73 } width={ 126 } height={ 18 } rx={ 4 } fill={ FILL } />
		<Bar x={ 36 } y={ 101 } width={ 52 } fill={ GREEN_DEEP } />
		<Rect
			x={ 36 }
			y={ 112 }
			width={ 126 }
			height={ 20 }
			rx={ 4 }
			fill={ CARD }
			stroke={ GREEN_DEEP }
			strokeWidth={ 2 }
		/>
		<Bar x={ 36 } y={ 146 } width={ 44 } />
		<Rect x={ 36 } y={ 157 } width={ 126 } height={ 18 } rx={ 4 } fill={ FILL } />

		{ /* Settings sidebar */ }
		<Rect x={ 188 } y={ 48 } width={ 100 } height={ 144 } rx={ 8 } fill={ CARD } />
		<Bar x={ 198 } y={ 60 } width={ 54 } />
		<Bar x={ 198 } y={ 78 } width={ 40 } height={ 5 } fill={ MUTED } />
		<Rect x={ 198 } y={ 88 } width={ 80 } height={ 14 } rx={ 3 } fill={ FILL } />
		<Bar x={ 198 } y={ 110 } width={ 44 } height={ 5 } fill={ MUTED } />
		<Rect x={ 198 } y={ 120 } width={ 80 } height={ 14 } rx={ 3 } fill={ FILL } />
		<Bar x={ 198 } y={ 148 } width={ 36 } height={ 5 } fill={ MUTED } />
		<Rect x={ 246 } y={ 142 } width={ 32 } height={ 16 } rx={ 8 } fill={ GREEN_DEEP } />
		<Circle cx={ 270 } cy={ 150 } r={ 6 } fill={ CARD } />
	</Canvas>
);

/**
 * Slide 4 — a submitted form branching into a confirmation and a notification.
 *
 * @return The illustration.
 */
export const AfterSubmitIllustration = () => (
	<Canvas>
		{ /* Form being submitted */ }
		<Rect x={ 86 } y={ 26 } width={ 140 } height={ 96 } rx={ 8 } fill={ CARD } />
		<Bar x={ 98 } y={ 42 } width={ 40 } />
		<Rect x={ 98 } y={ 53 } width={ 116 } height={ 16 } rx={ 4 } fill={ FILL } />
		<Rect x={ 164 } y={ 82 } width={ 50 } height={ 20 } rx={ 4 } fill={ GREEN_DEEP } />

		{ /* Flow arrow */ }
		<Rect x={ 154 } y={ 130 } width={ 4 } height={ 16 } rx={ 2 } fill={ CARD } opacity={ 0.9 } />
		<Path d="M148 146 L164 146 L156 158 Z" fill={ CARD } opacity={ 0.9 } />

		{ /* Confirmation message */ }
		<Rect x={ 40 } y={ 170 } width={ 108 } height={ 44 } rx={ 8 } fill={ CARD } />
		<Circle cx={ 64 } cy={ 192 } r={ 11 } fill={ GREEN_DEEP } />
		<Path
			d="M59 192 L63 196 L70 188"
			stroke={ CARD }
			strokeWidth={ 2.5 }
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<Bar x={ 82 } y={ 185 } width={ 50 } />
		<Bar x={ 82 } y={ 197 } width={ 32 } fill={ FILL } />

		{ /* Email notification */ }
		<Rect x={ 164 } y={ 170 } width={ 108 } height={ 44 } rx={ 8 } fill={ CARD } />
		<Rect
			x={ 176 }
			y={ 181 }
			width={ 30 }
			height={ 22 }
			rx={ 3 }
			fill={ FILL }
			stroke={ MUTED }
			strokeWidth={ 1.5 }
		/>
		<Path
			d="M176 184 L191 195 L206 184"
			stroke={ MUTED }
			strokeWidth={ 1.5 }
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<Bar x={ 216 } y={ 185 } width={ 44 } />
		<Bar x={ 216 } y={ 197 } width={ 28 } fill={ FILL } />
	</Canvas>
);

/**
 * Slide 5 — the published form on a page, with responses arriving in the inbox.
 *
 * @return The illustration.
 */
export const PublishIllustration = () => (
	<Canvas>
		{ /* Page containing the form */ }
		<Rect x={ 26 } y={ 40 } width={ 150 } height={ 160 } rx={ 8 } fill={ CARD } />
		<Circle cx={ 40 } cy={ 52 } r={ 3 } fill={ MUTED } />
		<Circle cx={ 50 } cy={ 52 } r={ 3 } fill={ MUTED } />
		<Circle cx={ 60 } cy={ 52 } r={ 3 } fill={ MUTED } />
		<Rect x={ 26 } y={ 63 } width={ 150 } height={ 1 } fill={ LINE } />
		<Bar x={ 40 } y={ 78 } width={ 36 } />
		<Rect x={ 40 } y={ 89 } width={ 122 } height={ 16 } rx={ 4 } fill={ FILL } />
		<Bar x={ 40 } y={ 115 } width={ 48 } />
		<Rect x={ 40 } y={ 126 } width={ 122 } height={ 16 } rx={ 4 } fill={ FILL } />
		<Rect x={ 112 } y={ 154 } width={ 50 } height={ 18 } rx={ 4 } fill={ GREEN_DEEP } />

		{ /* Responses inbox */ }
		<Rect x={ 196 } y={ 64 } width={ 92 } height={ 112 } rx={ 8 } fill={ CARD } />
		<Bar x={ 206 } y={ 76 } width={ 48 } />
		<G>
			<Circle cx={ 214 } cy={ 104 } r={ 7 } fill={ FILL } />
			<Bar x={ 227 } y={ 99 } width={ 48 } height={ 5 } />
			<Bar x={ 227 } y={ 108 } width={ 32 } height={ 5 } fill={ FILL } />
		</G>
		<G>
			<Circle cx={ 214 } cy={ 132 } r={ 7 } fill={ FILL } />
			<Bar x={ 227 } y={ 127 } width={ 42 } height={ 5 } />
			<Bar x={ 227 } y={ 136 } width={ 36 } height={ 5 } fill={ FILL } />
		</G>
		<G>
			<Circle cx={ 214 } cy={ 160 } r={ 7 } fill={ FILL } />
			<Bar x={ 227 } y={ 155 } width={ 50 } height={ 5 } />
			<Bar x={ 227 } y={ 164 } width={ 28 } height={ 5 } fill={ FILL } />
		</G>
	</Canvas>
);
