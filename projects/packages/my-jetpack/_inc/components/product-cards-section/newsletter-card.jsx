import PropTypes from 'prop-types';
import React from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import ProductCard from '../connected-product-card';

const NewsletterCard = ( { admin } ) => {
	const actionOverride = {
		[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ]: {
			href: 'admin.php?page=jetpack#/settings?term=newsletter',
		},
		[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ]: {
			href: 'admin.php?page=jetpack#/settings?term=newsletter',
		},
	};

	return <ProductCard admin={ admin } slug="newsletter" primaryActionOverride={ actionOverride } />;
};

NewsletterCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default NewsletterCard;
