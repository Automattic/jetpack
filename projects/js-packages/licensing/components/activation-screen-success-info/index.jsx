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
import {
	JetpackBackupDailyProductDetails,
	JetpackSecurityDailyProductDetails,
} from './product-details';

/**
 * Style dependencies
 */
import './style.scss';

const productIdToDetails = ( productId, dashboardUrl ) => {
	switch ( productId ) {
		case 2100:
			return <JetpackBackupDailyProductDetails dashboardUrl={ dashboardUrl } />;
		case 2010:
			return <JetpackSecurityDailyProductDetails dashboardUrl={ dashboardUrl } />;
		default:
			return null;
	}
};

/**
 * The Activation Screen Illustration component.
 * @param {object} props -- The properties.
 * @param {number} props.productId -- The id of the product activated
 * @param {number} props.dashboardUrl -- The url that links to the site dashboard
 * @returns {React.Component} The `ActivationSuccessInfo` component.
 */
const ActivationSuccessInfo = props => {
	const { dashboardUrl, productId } = props;
	return (
		<div className="jp-license-activation-screen-success-info">
			<div className="jp-license-activation-screen-success-info--content">
				<JetpackLogo showText={ false } height={ 48 } logoColor="#069E08" />
			</div>
			{ productIdToDetails( productId, dashboardUrl ) }
			<div>
				<Button className="jp-license-activation-screen-success-info--button" href={ dashboardUrl }>
					{ __( 'Go to Dashboard', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

ActivationSuccessInfo.PropTypes = {
	productId: PropTypes.number,
	dashboardUrl: PropTypes.string,
};

export default ActivationSuccessInfo;
