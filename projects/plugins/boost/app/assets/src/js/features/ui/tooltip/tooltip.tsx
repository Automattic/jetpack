import React, { ReactNode } from 'react';
import styles from './tooltip.module.scss';

type Props = {
	title?: string;
	children: ReactNode;
};

const Tooltip = ( { title, children }: Props ) => {
	return (
		<div className={ styles[ 'jb-tooltip' ] }>
			<span className={ styles[ 'jb-tooltip__info-icon' ] }>i</span>
			<div className={ styles[ 'jb-tooltip__info-container' ] }>
				{ title && <div className={ styles[ 'jb-tooltip__info-title' ] }>{ title }</div> }
				{ children }
				<i />
			</div>
		</div>
	);
};

export default Tooltip;
