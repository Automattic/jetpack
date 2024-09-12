import clsx from 'clsx';
import Card from 'components/card';
import React from 'react';

import './style.scss';

interface SectionHeaderProps {
	label: string;
	children?: React.ReactNode;
	className?: string;
	cardBadge?: string | React.ReactNode;
}

const SectionHeader = ( { label, children, className }: SectionHeaderProps ) => {
	const classes = clsx( className, 'dops-section-header' );

	return (
		<Card compact className={ classes }>
			<div className="dops-section-header__label">
				<span className="dops-section-header__label-text">{ label }</span>
			</div>
			<div className="dops-section-header__actions">{ children }</div>
		</Card>
	);
};
export default SectionHeader;
