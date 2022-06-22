import classNames from 'classnames';
import React from 'react';

import './style.scss';

type Props = {
	header: React.ReactNode;
	illustrationPath?: string;
	compact?: boolean;
};
const SidebarCard: React.FC< Props > = props => {
	const { header, children, illustrationPath, compact } = props;

	return (
		<div
			className={ classNames( 'jp-recommendations-sidebar-card', {
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
				className={ classNames( 'jp-recommendations-sidebar-card__content', {
					'is-compact': compact,
				} ) }
			>
				{ children }
			</div>
		</div>
	);
};

export { SidebarCard };
