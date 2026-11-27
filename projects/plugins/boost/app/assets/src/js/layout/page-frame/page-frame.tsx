import clsx from 'clsx';
import styles from './page-frame.module.scss';
import type { ReactNode } from 'react';

type PageFrameProps = {
	children: ReactNode;
	className?: string;
	white?: boolean;
};

/**
 * The frame Getting Started and Purchase Success render their content in.
 *
 * @param {PageFrameProps} props - Component props.
 * @return The framed content.
 */
const PageFrame = ( { children, className, white = false }: PageFrameProps ) => (
	<div className={ clsx( styles.frame, { [ styles.white ]: white }, className ) }>{ children }</div>
);

export default PageFrame;
