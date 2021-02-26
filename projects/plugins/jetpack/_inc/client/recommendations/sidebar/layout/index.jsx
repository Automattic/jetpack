/**
 * External dependencies
 */
import React from 'react';

/**
 * Style dependencies
 */
import './style.scss';

const Layout = props => {
	const { content, illustrationPath } = props;

	return (
		<div className="jp-recommendations-sidebar-card">
			<div className="jp-recommendations-sidebar-card__illustration-container">
				<div className="jp-recommendations-sidebar-card__illustration">
					<img src={ illustrationPath } alt="" />
				</div>
			</div>
			<div className="jp-recommendations-sidebar-card__content">{ content }</div>
		</div>
	);
};

export { Layout };
