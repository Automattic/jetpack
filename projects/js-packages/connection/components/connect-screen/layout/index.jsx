import { JetpackLogo } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';
import React from 'react';
import ImageSlider from './image-slider';
import './style.scss';

/**
 * The Connection Screen Layout component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectScreenLayout` component.
 */
const ConnectScreenLayout = props => {
	const { title, children, className, assetBaseUrl, images } = props;

	const showImageSlider = images?.length;

	return (
		<div
			className={
				'jp-connection__connect-screen-layout' +
				( showImageSlider ? ' jp-connection__connect-screen-layout__two-columns' : '' ) +
				( className ? ' ' + className : '' )
			}
		>
			<div className="jp-connection__connect-screen-layout__left">
				<JetpackLogo />

				<h2>{ title }</h2>

				{ children }
			</div>

			{ showImageSlider ? (
				<div className="jp-connection__connect-screen-layout__right">
					<ImageSlider images={ images } assetBaseUrl={ assetBaseUrl } />
				</div>
			) : null }
		</div>
	);
};

ConnectScreenLayout.propTypes = {
	/** The Title. */
	title: PropTypes.string,
	/** Class to be added to component. */
	className: PropTypes.string,
	/** Images to display on the right side. */
	images: PropTypes.arrayOf( PropTypes.string ),
	/** The assets base URL. */
	assetBaseUrl: PropTypes.string,
};

export default ConnectScreenLayout;
