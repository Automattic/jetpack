/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import './style.scss';

/**
 * A decorative card used in the disconnection flow.
 *
 * @param {string} props.format - The format of the card (horizontal or vertical)
 * @param {string} props.icon - An icon slug that can be used to show an icon (options are limited to what is in the stylesheet)
 * @param {string} props.imageUrl - URL for an image to show in the card.
 * @returns {React.Component} - The DecorativeCard component.
 */

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
				style={ { backgroundImage: imageUrl ? `url( ${ imageUrl } )` : '' } }
			></div>
			<div className="jp-decorative-card__content">
				<div className="jp-decorative-card__lines"></div>
			</div>
			{ renderIcon() }
		</div>
	);
};

export default DecorativeCard;
