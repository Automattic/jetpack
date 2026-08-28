import { useLayoutEffect, useRef } from 'react';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

// Frame the widget root like the dashboard host cell for state stories:
// - `justify-content: safe center` vertically centers a state shorter than the
//   frame (the `height: 100%` error/empty boxes otherwise cling to the top);
//   `safe` falls back to top alignment when content is taller, so a full
//   leaderboard is never clipped at the top.
//
// The styles are applied to the widget's own root (the element WidgetRoot marks
// with `container-name: widget`) rather than via a CSS descendant selector,
// because Storybook inserts a `display: contents` wrapper of varying depth
// between the card and the widget that makes positional selectors unreliable.
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

// A white, widget-sized card that frames a story the way the dashboard host frames a
// widget in product, so each state (ready / loading / error / empty) reads as a real
// dashboard widget rather than a bare fragment on the Storybook canvas.
export function WidgetCanvas( {
	children,
	width = '380px',
}: {
	children: ReactNode;
	/** Card width. Defaults to a one-column dashboard cell. */
	width?: string;
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
				height: '440px',
				margin: '0 auto',
				padding: '16px',
				boxSizing: 'border-box',
				background: '#fff',
				border: '1px solid #e0e0e0',
				borderRadius: '8px',
				overflow: 'hidden',
			} }
		>
			{ children }
		</div>
	);
}

// Decorator form of WidgetCanvas for the close-up widget stories.
export const withWidgetCanvas: Decorator = Story => (
	<WidgetCanvas>
		<Story />
	</WidgetCanvas>
);

// A two-column-wide card, for widgets whose layout only appears above the
// 720px container query (the email breakdown's country map, for example).
export const withWideWidgetCanvas: Decorator = Story => (
	<WidgetCanvas width="800px">
		<Story />
	</WidgetCanvas>
);
