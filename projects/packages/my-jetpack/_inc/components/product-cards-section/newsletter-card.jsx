import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import ProductCard from '../connected-product-card';

const NEWSLETTER_SETTINGS_PAGE_URL = 'admin.php?page=jetpack#/newsletter';

const NewsletterCard = ( { admin } ) => {
	const actionOverride = {
		[ PRODUCT_STATUSES.NEEDS_PURCHASE_OR_FREE ]: {
			href: NEWSLETTER_SETTINGS_PAGE_URL,
		},
		[ PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION ]: {
			href: NEWSLETTER_SETTINGS_PAGE_URL,
		},
		[ PRODUCT_STATUSES.INACTIVE ]: {
			href: NEWSLETTER_SETTINGS_PAGE_URL,
			label: __( 'View', 'jetpack-my-jetpack' ),
			onClick: () => {},
		},
		[ PRODUCT_STATUSES.MODULE_DISABLED ]: {
			href: NEWSLETTER_SETTINGS_PAGE_URL,
			label: __( 'View', 'jetpack-my-jetpack' ),
			onClick: () => {},
		},
	};

	return <ProductCard admin={ admin } slug="newsletter" primaryActionOverride={ actionOverride } />;
};

NewsletterCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default NewsletterCard;
