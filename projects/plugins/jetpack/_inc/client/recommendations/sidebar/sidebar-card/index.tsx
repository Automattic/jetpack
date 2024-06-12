import clsx from 'clsx';
import React from 'react';

import './style.scss';

type Props = {
	header: React.ReactNode;
	children: React.ReactNode;
	illustrationPath?: string;
	compact?: boolean;
	className?: string;
};
const SidebarCard: React.FC< Props > = props => {
	const { header, children, illustrationPath, compact, className } = props;

	return (
		<div
			className={ clsx( 'jp-recommendations-sidebar-card', className, {
				'with-illustration': !! illustrationPath,
			} ) }
		>
			{ illustrationPath ? (
				<div className="jp-recommendations-sidebar-card__illustration-container">
					<div className="jp-recommendations-sidebar-card__illustration">
						<img src={ illustrationPath } alt="" />
					</div>
				</div>
			) : (
				header
			) }
			<div
				className={ clsx( 'jp-recommendations-sidebar-card__content', {
					'is-compact': compact,
				} ) }
			>
				{ children }
			</div>
		</div>
	);
};

export { SidebarCard };
