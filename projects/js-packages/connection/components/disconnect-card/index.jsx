import PropTypes from 'prop-types';
import React from 'react';

import './style.scss';

/**
 * Show a card with a title, value and description.
 * Used in the disconnection flow.
 *
 * @param {object} props - The Properties.
 * @returns {React.Component} DisconnectCard - The disconnect card component.
 */
const DisconnectCard = props => {
	const { title, value, description } = props;

	return (
		<div className="jp-connection__disconnect-card card">
			<div className="jp-connection__disconnect-card__card-content">
				<p className="jp-connection__disconnect-card__card-headline">{ title }</p>
				{ ( value || description ) && (
					<div className="jp-connection__disconnect-card__card-stat-block">
						<span className="jp-connection__disconnect-card__card-stat">{ value }</span>
						<div className="jp-connection__disconnect-card__card-description">{ description }</div>
					</div>
				) }
			</div>
		</div>
	);
};

DisconnectCard.propTypes = {
	/** The title to show on the disconnect card. */
	title: PropTypes.string,
	/** Optional value/ statistic to show. */
	value: PropTypes.oneOfType( [ PropTypes.string, PropTypes.number ] ),
	/** Description to go with the stat value. */
	description: PropTypes.number,
};

export default DisconnectCard;
