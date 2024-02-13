import React, { ReactNode } from 'react';
import styles from './pill.module.scss';

interface PillProps {
	color: string;
	children: ReactNode;
}

const Pill: React.FC< PillProps > = ( { color, children } ) => {
	const pillStyle = {
		'--jb-pill-color': color,
	} as React.CSSProperties;

	return (
		<div className={ styles.pill } style={ pillStyle }>
			<span className={ styles.text }>{ children }</span>
		</div>
	);
};

export default Pill;
