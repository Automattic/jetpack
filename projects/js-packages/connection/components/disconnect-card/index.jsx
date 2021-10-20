/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import './style.scss';

const DisconnectCard = props => {
	const { title, value, description } = props;

	const renderStatBlock = () => {
		if ( value || description ) {
			return (
				<div className="jp-disconnect-card__card-stat-block">
					<span className="jp-disconnect-card__card-stat">{ value }</span>
					<div className="jp-disconnect-card__card-description">{ description }</div>
				</div>
			);
		}
	};

	return (
		<div className="jp-disconnect-card card">
			<div className="jp-disconnect-card__card-content">
				<p className="jp-disconnect-card__card-headline">{ title }</p>
				{ renderStatBlock() }
			</div>
		</div>
	);
};

export default DisconnectCard;
