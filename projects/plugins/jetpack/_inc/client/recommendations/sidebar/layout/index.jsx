import classNames from 'classnames';
import React from 'react';

import './style.scss';

const Layout = props => {
	const { header, content, illustrationPath } = props;

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
			<div className="jp-recommendations-sidebar-card__content">{ content }</div>
		</div>
	);
};

export { Layout };
