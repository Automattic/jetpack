import { Center } from '../center';
import styles from './svg-empty-state.module.scss';
import type { FC, ReactNode } from 'react';

interface SvgEmptyStateProps {
	/** X coordinate of the center point */
	x: number;
	/** Y coordinate of the center point */
	y: number;
	/** Available width for the text area */
	width: number;
	/** Available height for the text area */
	height: number;
	/** Text content */
	children: ReactNode;
}

/**
 * Renders empty-state text inside an SVG using foreignObject so that the
 * message wraps onto multiple lines instead of being clipped.
 *
 * The component centers the text within the specified area.
 *
 * @param  root0          - Component props
 * @param  root0.x        - X coordinate of the center point
 * @param  root0.y        - Y coordinate of the center point
 * @param  root0.width    - Available width for the text area
 * @param  root0.height   - Available height for the text area
 * @param  root0.children - Text content
 * @return {JSX.Element} A foreignObject element containing the centered text.
 */
export const SvgEmptyState: FC< SvgEmptyStateProps > = ( { x, y, width, height, children } ) => {
	return (
		<foreignObject x={ x - width / 2 } y={ y - height / 2 } width={ width } height={ height }>
			<Center className={ styles[ 'svg-empty-state' ] }>{ children }</Center>
		</foreignObject>
	);
};
