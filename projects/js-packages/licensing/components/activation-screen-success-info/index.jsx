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
import JetpackProductDetails from './product-details';
import { ProductLink } from './product-link';

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
	return (
		<div className="jp-license-activation-screen-success-info">
			<div className="jp-license-activation-screen-success-info--content">
				<JetpackLogo showText={ false } height={ 48 } />
			</div>
			<JetpackProductDetails siteRawUrl={ siteRawUrl } productId={ productId } />
			<div className="jp-license-activation-screen-success-info--buttons">
				<Button
					className="jp-license-activation-screen-success-info--button"
					href={ '/wp-admin/admin.php?page=jetpack#/my-plan' }
				>
					{ __( 'View my plans', 'jetpack' ) }
				</Button>
				<ProductLink siteRawUrl={ siteRawUrl } productId={ productId } />
			</div>
		</div>
	);
};

ActivationSuccessInfo.propTypes = {
	siteRawUrl: PropTypes.string,
	productId: PropTypes.number,
};

export default ActivationSuccessInfo;
