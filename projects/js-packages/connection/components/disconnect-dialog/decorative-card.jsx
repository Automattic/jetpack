/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import './_jp-decorative-card.scss';

const DecorativeCard = props => {
	const { format, icon } = props;

	const renderIcon = () => {
		if ( icon ) {
			return (
				<div className="jp-decorative-card__icon-container">
					<span className={ 'jp-decorative-card__icon jp-decorative-card__icon--' + icon }></span>
				</div>
			);
		}
	};

	return (
		<div className={ 'jp-decorative-card ' + ( format ? 'jp-decorative-card--' + format : '' ) }>
			<div className="jp-decorative-card__image"></div>
			<div className="jp-decorative-card__content">
				<div className="jp-decorative-card__lines"></div>
			</div>
			{ renderIcon() }
		</div>
	);
};

export default DecorativeCard;
