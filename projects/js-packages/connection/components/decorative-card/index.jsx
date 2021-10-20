/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import './style.scss';

const DecorativeCard = props => {
	const { format, icon, imageUrl } = props;

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
			<div
				className="jp-decorative-card__image"
				style={ { backgroundImage: imageUrl ? 'url(' + imageUrl + ')' : '' } }
			></div>
			<div className="jp-decorative-card__content">
				<div className="jp-decorative-card__lines"></div>
			</div>
			{ renderIcon() }
		</div>
	);
};

export default DecorativeCard;
