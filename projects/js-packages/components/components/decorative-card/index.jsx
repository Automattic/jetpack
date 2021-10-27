/**
 * External Dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal Dependencies
 */
import './style.scss';

/**
 * A decorative card used in the disconnection flow.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} - The DecorativeCard component.
 */

const DecorativeCard = props => {
	const { format, icon, imageUrl } = props;

	const renderIcon = () => {
		if ( icon ) {
			return (
				<div className="jp-components__decorative-card__icon-container">
					<span
						className={
							'jp-components__decorative-card__icon jp-components__decorative-card__icon--' + icon
						}
					></span>
				</div>
			);
		}
	};

	return (
		<div
			className={
				'jp-components__decorative-card ' +
				( format ? 'jp-components__decorative-card--' + format : '' )
			}
		>
			<div
				className="jp-components__decorative-card__image"
				style={ { backgroundImage: imageUrl ? `url( ${ imageUrl } )` : '' } }
			></div>
			<div className="jp-components__decorative-card__content">
				<div className="jp-components__decorative-card__lines"></div>
			</div>
			{ renderIcon() }
		</div>
	);
};

DecorativeCard.PropTypes = {
	/** The format of the card (horizontal or vertical) */
	format: PropTypes.string,
	/** An icon slug that can be used to show an icon (options are limited to what is in the stylesheet) */
	icon: PropTypes.string,
	/** URL for an image to show in the card. */
	imageUrl: PropTypes.string,
};

export default DecorativeCard;
