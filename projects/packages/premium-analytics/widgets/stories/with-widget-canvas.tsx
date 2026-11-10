import { useElementSize } from '@jetpack-premium-analytics/widgets-toolkit';
import { useLayoutEffect, useRef } from 'react';
import type { Decorator, StoryContext } from '@storybook/react';
import type { ReactNode } from 'react';

// The card's own inset in pixels: a widget gets the card minus this on each side.
const CANVAS_PADDING = 16;
const CANVAS_BORDER = 1;
const CANVAS_INSET = CANVAS_PADDING + CANVAS_BORDER;

// Boxes a widget is handed in the size matrix, as [ inline, block ] pixels. The
// short row is the body of the dashboard's smallest cell, one row at the small
// row height.
const MATRIX_SIZES = [
	[ 320, 110 ],
	[ 520, 110 ],
	[ 760, 110 ],
	[ 320, 400 ],
	[ 520, 400 ],
	[ 760, 400 ],
] as const;

// Frames the widget root like the dashboard host cell: `safe center` vertically
// centers short states without clipping a taller one. Applied to the widget's own
// root, not a CSS descendant selector, since Storybook's wrapper depth varies.
function frameWidgetRoot( host: HTMLElement | null ) {
	if ( ! host ) {
		return;
	}
	const widgetRoot = Array.from( host.querySelectorAll< HTMLElement >( '*' ) ).find(
		el => getComputedStyle( el ).containerName === 'widget'
	);
	if ( ! widgetRoot ) {
		return;
	}
	widgetRoot.style.position = 'relative';
	widgetRoot.style.display = 'flex';
	widgetRoot.style.flexDirection = 'column';
	widgetRoot.style.justifyContent = 'safe center';
}

// A white, widget-sized card that frames a story like the dashboard host frames a
// widget in product, so every state reads as a real widget, not a bare fragment.
export function WidgetCanvas( {
	children,
	width = '380px',
	height = '440px',
	resizable = false,
}: {
	children: ReactNode;
	/** Card width. Defaults to a one-column dashboard cell. */
	width?: string;
	/** Card height. */
	height?: string;
	/** Lets the reader resize the card by its corner. */
	resizable?: boolean;
} ) {
	const hostRef = useRef< HTMLDivElement >( null );
	useLayoutEffect( () => {
		frameWidgetRoot( hostRef.current );
	} );
	return (
		<div
			ref={ hostRef }
			style={ {
				width,
				height,
				margin: '0 auto',
				padding: `${ CANVAS_PADDING }px`,
				boxSizing: 'border-box',
				background: '#fff',
				border: `${ CANVAS_BORDER }px solid #e0e0e0`,
				borderRadius: '8px',
				overflow: 'hidden',
				...( resizable && { resize: 'both', minWidth: '160px', minHeight: '100px' } ),
			} }
		>
			{ children }
		</div>
	);
}

// A WidgetCanvas captioned with the box the widget inside it gets, measured so
// the caption follows the card while the reader resizes it.
function SizedWidgetCanvas( {
	children,
	width,
	height,
	resizable,
}: {
	children: ReactNode;
	width?: string;
	height?: string;
	resizable?: boolean;
} ) {
	const [ cardRef, card ] = useElementSize< HTMLDivElement >();
	const inlineSize = Math.max( 0, card.width - CANVAS_INSET * 2 );
	const blockSize = Math.max( 0, card.height - CANVAS_INSET * 2 );

	return (
		<figure style={ { margin: 0 } }>
			<figcaption
				style={ { marginBlockEnd: '8px', font: '12px/1.5 monospace', textAlign: 'center' } }
			>
				{ `${ inlineSize } × ${ blockSize } px` }
			</figcaption>
			<div ref={ cardRef } style={ { inlineSize: 'fit-content', marginInline: 'auto' } }>
				<WidgetCanvas width={ width } height={ height } resizable={ resizable }>
					{ children }
				</WidgetCanvas>
			</div>
		</figure>
	);
}

// Frames a story the way the toolbar's "Widget sizes" mode asks: once in the
// usual card, once per box of the size matrix, or in a card the reader resizes.
export function WidgetSizesCanvas( {
	children,
	mode,
	width,
}: {
	children: ReactNode;
	/** The `widgetSizes` global; any other value frames the story once. */
	mode?: unknown;
	/** Card width outside the size matrix. */
	width?: string;
} ) {
	if ( mode === 'matrix' ) {
		return (
			<div style={ { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px' } }>
				{ MATRIX_SIZES.map( ( [ inlineSize, blockSize ] ) => (
					<SizedWidgetCanvas
						key={ `${ inlineSize }x${ blockSize }` }
						width={ `${ inlineSize + CANVAS_INSET * 2 }px` }
						height={ `${ blockSize + CANVAS_INSET * 2 }px` }
					>
						{ children }
					</SizedWidgetCanvas>
				) ) }
			</div>
		);
	}

	if ( mode === 'resizable' ) {
		return (
			<SizedWidgetCanvas width={ width } resizable>
				{ children }
			</SizedWidgetCanvas>
		);
	}

	return <WidgetCanvas width={ width }>{ children }</WidgetCanvas>;
}

// The mode applies to a story viewed on its own, where the toolbar offers it. A
// Docs page renders every story of a widget at once and keeps the usual card.
export function getWidgetSizesMode( {
	globals,
	viewMode,
}: Pick< StoryContext, 'globals' | 'viewMode' > ) {
	return viewMode === 'story' ? globals.widgetSizes : undefined;
}

// Decorator form of WidgetSizesCanvas for the close-up widget stories.
export const withWidgetCanvas: Decorator = ( Story, context ) => (
	<WidgetSizesCanvas mode={ getWidgetSizesMode( context ) }>
		<Story />
	</WidgetSizesCanvas>
);
