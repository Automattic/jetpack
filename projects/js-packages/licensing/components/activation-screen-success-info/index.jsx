/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { JetpackLogo } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */
import { getJetpackProductDashboardUrl } from '../activation-screen/utils';
import JetpackProductDetails from './product-details';

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
 * @returns {React.Component} The `ActivationSuccessInfo` component.
 */
const ActivationSuccessInfo = props => {
	const { productId, siteRawUrl } = props;
	const dashboardUrl = getJetpackProductDashboardUrl( productId, siteRawUrl );
	return (
		<div className="jp-license-activation-screen-success-info">
			<div className="jp-license-activation-screen-success-info--content">
				<JetpackLogo showText={ false } height={ 48 } />
			</div>
			<JetpackProductDetails siteRawUrl={ siteRawUrl } productId={ productId } />
			<div>
				<Button className="jp-license-activation-screen-success-info--button" href={ dashboardUrl }>
					{ __( 'Go to Dashboard', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

ActivationSuccessInfo.propTypes = {
	siteRawUrl: PropTypes.string,
	productId: PropTypes.number,
};

export default ActivationSuccessInfo;
