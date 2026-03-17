import { isSafari } from '../../utils';
import type { FC, ReactNode, CSSProperties } from 'react';

interface SvgEmptyStateProps {
	/** X coordinate of the center point */
	x: number;
	/** Y coordinate of the center point */
	y: number;
	/** Available width for the text area */
	width: number;
	/** Available height for the text area */
	height: number;
	/** Fill color for the text */
	fill?: string;
	/** Text content */
	children: ReactNode;
}

/**
 * Renders empty-state text inside an SVG using foreignObject so that the
 * message wraps onto multiple lines instead of being clipped.
 *
 * The component centers the text within the specified area.  Safari's
 * foreignObject positioning quirks are handled with the same workaround
 * used elsewhere in this package (position: fixed).
 */
export const SvgEmptyState: FC< SvgEmptyStateProps > = ( {
	x,
	y,
	width,
	height,
	fill = '#ccc',
	children,
} ) => {
	const textStyles: CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		width: '100%',
		height: '100%',
		color: fill,
		fontSize: '14px',
		fontFamily: '-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif',
		padding: '16px',
		boxSizing: 'border-box',
		...( isSafari() ? ( { position: 'fixed' as const } ) : {} ),
	};

	return (
		<foreignObject
			x={ x - width / 2 }
			y={ y - height / 2 }
			width={ width }
			height={ height }
		>
			<div style={ textStyles }>{ children }</div>
		</foreignObject>
	);
};
