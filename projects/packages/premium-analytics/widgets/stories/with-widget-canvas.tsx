import { useLayoutEffect, useRef } from 'react';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

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
