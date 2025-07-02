import { ReactNode } from 'react';
import type { CSSProperties, FC } from 'react';
import styles from './pill.module.scss';

interface PillProps {
	color: string;
	children: ReactNode;
}

const Pill: FC< PillProps > = ( { color, children } ) => {
	const pillStyle = {
		'--jb-pill-color': color,
	} as CSSProperties;

	return (
		<div className={ styles.pill } style={ pillStyle }>
			<span className={ styles.text }>{ children }</span>
		</div>
	);
};

export default Pill;
