/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */
import JetpackProductDetails from './product-details';
import { ProductLink } from './product-link';
import { PrimaryLink } from './primary-link';

/**
 * Style dependencies
 */
import './style.scss';

/**
 * The Activation Screen Illustration component.
 *
 * @param {object} props -- The properties.
 * @param {number} props.productId -- The id of the product activated
 * @param {string} props.siteRawUrl -- The url of the site
 * @param {string} props.initialStateRecommendationsStep -- The current recommendation step.
 * @returns {React.Component} The `ActivationSuccessInfo` component.
 */
const ActivationSuccessInfo = props => {
	const { productId, siteRawUrl, initialStateRecommendationsStep } = props;
	return (
		<div className="jp-license-activation-screen-success-info">
			<div className="jp-license-activation-screen-success-info--content">
				<JetpackLogo showText={ false } height={ 48 } />
			</div>
			<JetpackProductDetails siteRawUrl={ siteRawUrl } productId={ productId } />
			<div className="jp-license-activation-screen-success-info--buttons">
				<PrimaryLink initialStateRecommendationsStep={ initialStateRecommendationsStep } />
				<ProductLink siteRawUrl={ siteRawUrl } productId={ productId } />
			</div>
		</div>
	);
};

ActivationSuccessInfo.propTypes = {
	siteRawUrl: PropTypes.string,
	productId: PropTypes.number,
	initialStateRecommendationsStep: PropTypes.string,
};

export default ActivationSuccessInfo;
