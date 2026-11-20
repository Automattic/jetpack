import { animated, useSpring } from '@react-spring/web';
import useMeasure from 'react-use-measure';
import type { CSSProperties, ReactNode } from 'react';

type CollapseProps = {
	open?: boolean;
	onCollapsed?: () => void;
	className?: string;
	contentClassName?: string;
	style?: CSSProperties;
	children: ReactNode;
};

/**
 * Animates its content's height to zero when closed, then reports it.
 *
 * @param props                  - Component props.
 * @param props.open             - Whether the content is shown.
 * @param props.onCollapsed      - Called once the closing animation has finished.
 * @param props.className        - Class for the animated wrapper.
 * @param props.contentClassName - Class for the measured content element.
 * @param props.style            - Extra styles for the animated wrapper.
 * @param props.children         - Content to collapse.
 */
const Collapse = ( {
	open = true,
	onCollapsed,
	className,
	contentClassName,
	style,
	children,
}: CollapseProps ) => {
	const [ ref, { height } ] = useMeasure();
	const animationStyles = useSpring( {
		height: open ? height : 0,
		onRest: open ? undefined : onCollapsed,
	} );

	return (
		<animated.div className={ className } style={ { ...style, ...animationStyles } }>
			<div ref={ ref } className={ contentClassName }>
				{ children }
			</div>
		</animated.div>
	);
};

export default Collapse;
