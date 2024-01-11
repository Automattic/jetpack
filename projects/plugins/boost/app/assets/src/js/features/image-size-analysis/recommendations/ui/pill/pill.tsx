import React, { ReactNode } from 'react';

interface PillProps {
	color: string;
	children: ReactNode;
}

const Pill: React.FC< PillProps > = ( { color, children } ) => {
	const pillStyle = {
		'--jb-pill-color': color,
	} as React.CSSProperties;

	return (
		<div className="jb-pill" style={ pillStyle }>
			<span className="jb-pill__text">{ children }</span>
		</div>
	);
};

export default Pill;
