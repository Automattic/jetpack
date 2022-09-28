import { imagePath } from 'constants/urls';
import {
	PLAN_FREE,
	PLAN_PERSONAL,
	PLAN_PERSONAL_2_YEARS,
	PLAN_PERSONAL_MONTHLY,
	PLAN_STARTER,
	PLAN_PREMIUM,
	PLAN_PREMIUM_2_YEARS,
	PLAN_PREMIUM_MONTHLY,
	PLAN_BUSINESS,
	PLAN_BUSINESS_2_YEARS,
	PLAN_BUSINESS_MONTHLY,
	PLAN_ECOMMERCE,
	PLAN_ECOMMERCE_2_YEARS,
	PLAN_ECOMMERCE_MONTHLY,
	PLAN_PRO,
	PLAN_VIP,
	PLAN_WPCOM_SEARCH,
	PLAN_WPCOM_SEARCH_MONTHLY,
	PLAN_JETPACK_BACKUP_T0_YEARLY,
	PLAN_JETPACK_BACKUP_T0_MONTHLY,
	PLAN_JETPACK_BACKUP_T1_YEARLY,
	PLAN_JETPACK_BACKUP_T1_MONTHLY,
	PLAN_JETPACK_BACKUP_T2_YEARLY,
	PLAN_JETPACK_BACKUP_T2_MONTHLY,
	PLAN_JETPACK_SCAN,
	PLAN_JETPACK_SCAN_MONTHLY,
	PLAN_JETPACK_ANTI_SPAM,
	PLAN_JETPACK_ANTI_SPAM_MONTHLY,
	PLAN_JETPACK_SEARCH,
	PLAN_JETPACK_SEARCH_MONTHLY,
	PLAN_JETPACK_FREE,
	PLAN_JETPACK_PERSONAL,
	PLAN_JETPACK_PERSONAL_MONTHLY,
	PLAN_JETPACK_PREMIUM,
	PLAN_JETPACK_PREMIUM_MONTHLY,
	PLAN_JETPACK_BUSINESS,
	PLAN_JETPACK_BUSINESS_MONTHLY,
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_SECURITY_T1_MONTHLY,
	PLAN_JETPACK_SECURITY_T2_YEARLY,
	PLAN_JETPACK_SECURITY_T2_MONTHLY,
	PLAN_JETPACK_COMPLETE,
	PLAN_JETPACK_COMPLETE_MONTHLY,
	PLAN_JETPACK_VIDEOPRESS,
	PLAN_JETPACK_VIDEOPRESS_MONTHLY,

	// DEPRECATED: Daily and Real-time variations will soon be retired.
	// Remove after all customers are migrated to new products.
	PLAN_JETPACK_BACKUP_DAILY,
	PLAN_JETPACK_BACKUP_DAILY_MONTHLY,
	PLAN_JETPACK_BACKUP_REALTIME,
	PLAN_JETPACK_BACKUP_REALTIME_MONTHLY,
	PLAN_JETPACK_SECURITY_DAILY,
	PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
	PLAN_JETPACK_SECURITY_REALTIME,
	PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
} from 'lib/plans/constants';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import './style.scss';

const PRODUCT_ICON_MAP = {
	[ PLAN_FREE ]: '/plans/wpcom-free.svg',
	[ PLAN_PERSONAL ]: '/plans/wpcom-personal.svg',
	[ PLAN_PERSONAL_2_YEARS ]: '/plans/wpcom-personal.svg',
	[ PLAN_PERSONAL_MONTHLY ]: '/plans/wpcom-personal.svg',
	[ PLAN_STARTER ]: '/plans/wpcom-personal.svg',
	[ PLAN_PREMIUM ]: '/plans/wpcom-premium.svg',
	[ PLAN_PREMIUM_2_YEARS ]: '/plans/wpcom-premium.svg',
	[ PLAN_PREMIUM_MONTHLY ]: '/plans/wpcom-premium.svg',
	[ PLAN_BUSINESS ]: '/plans/wpcom-business.svg',
	[ PLAN_BUSINESS_2_YEARS ]: '/plans/wpcom-business.svg',
	[ PLAN_BUSINESS_MONTHLY ]: '/plans/wpcom-business.svg',
	[ PLAN_PRO ]: '/plans/wpcom-business.svg',
	[ PLAN_ECOMMERCE ]: '/plans/wpcom-ecommerce.svg',
	[ PLAN_ECOMMERCE_2_YEARS ]: '/plans/wpcom-ecommerce.svg',
	[ PLAN_ECOMMERCE_MONTHLY ]: '/plans/wpcom-ecommerce.svg',
	[ PLAN_VIP ]: '/plans/wpcom-ecommerce.svg',
	[ PLAN_WPCOM_SEARCH ]: '/products/product-jetpack-search.svg',
	[ PLAN_WPCOM_SEARCH_MONTHLY ]: '/products/product-jetpack-search.svg',
	[ PLAN_JETPACK_BACKUP_T0_YEARLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_T0_MONTHLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_T1_YEARLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_T1_MONTHLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_T2_YEARLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_T2_MONTHLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_SCAN ]: '/products/product-jetpack-scan.svg',
	[ PLAN_JETPACK_SCAN_MONTHLY ]: '/products/product-jetpack-scan.svg',
	[ PLAN_JETPACK_ANTI_SPAM ]: '/products/product-jetpack-anti-spam.svg',
	[ PLAN_JETPACK_ANTI_SPAM_MONTHLY ]: '/products/product-jetpack-anti-spam.svg',
	[ PLAN_JETPACK_SEARCH ]: '/products/product-jetpack-search.svg',
	[ PLAN_JETPACK_SEARCH_MONTHLY ]: '/products/product-jetpack-search.svg',
	[ PLAN_JETPACK_FREE ]: '/plans/jetpack-free.svg',
	[ PLAN_JETPACK_PERSONAL ]: '/plans/jetpack-personal.svg',
	[ PLAN_JETPACK_PERSONAL_MONTHLY ]: '/plans/jetpack-personal.svg',
	[ PLAN_JETPACK_PREMIUM ]: '/plans/jetpack-premium.svg',
	[ PLAN_JETPACK_PREMIUM_MONTHLY ]: '/plans/jetpack-premium.svg',
	[ PLAN_JETPACK_BUSINESS ]: '/plans/jetpack-professional.svg',
	[ PLAN_JETPACK_BUSINESS_MONTHLY ]: '/plans/jetpack-professional.svg',
	[ PLAN_JETPACK_SECURITY_T1_YEARLY ]: '/plans/jetpack-security.svg',
	[ PLAN_JETPACK_SECURITY_T1_MONTHLY ]: '/plans/jetpack-security.svg',
	[ PLAN_JETPACK_SECURITY_T2_YEARLY ]: '/plans/jetpack-security.svg',
	[ PLAN_JETPACK_SECURITY_T2_MONTHLY ]: '/plans/jetpack-security.svg',
	[ PLAN_JETPACK_COMPLETE ]: '/plans/jetpack-complete.svg',
	[ PLAN_JETPACK_COMPLETE_MONTHLY ]: '/plans/jetpack-complete.svg',
	[ PLAN_JETPACK_VIDEOPRESS ]: '/products/product-jetpack-videopress.svg',
	[ PLAN_JETPACK_VIDEOPRESS_MONTHLY ]: '/products/product-jetpack-videopress.svg',

	// DEPRECATED: Daily and Real-time variations will soon be retired.
	// Remove after all customers are migrated to new products.
	[ PLAN_JETPACK_BACKUP_DAILY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_DAILY_MONTHLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_REALTIME ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_BACKUP_REALTIME_MONTHLY ]: '/products/product-jetpack-backup.svg',
	[ PLAN_JETPACK_SECURITY_DAILY ]: '/plans/jetpack-security.svg',
	[ PLAN_JETPACK_SECURITY_DAILY_MONTHLY ]: '/plans/jetpack-security.svg',
	[ PLAN_JETPACK_SECURITY_REALTIME ]: '/plans/jetpack-security.svg',
	[ PLAN_JETPACK_SECURITY_REALTIME_MONTHLY ]: '/plans/jetpack-security.svg',
};
const DEFAULT_SIZE = 32;

export default class PlanIcon extends Component {
	render() {
		const { className, alt, plan } = this.props;

		return (
			<img
				className={ className }
				src={ imagePath + PRODUCT_ICON_MAP[ plan ] }
				width={ DEFAULT_SIZE }
				height={ DEFAULT_SIZE }
				alt={ alt || '' }
			/>
		);
	}
}

PlanIcon.propTypes = {
	classNames: PropTypes.string,
	alt: PropTypes.string,
	plan: PropTypes.oneOf( [
		PLAN_FREE,
		PLAN_PERSONAL,
		PLAN_PERSONAL_2_YEARS,
		PLAN_PERSONAL_MONTHLY,
		PLAN_STARTER,
		PLAN_PREMIUM,
		PLAN_PREMIUM_2_YEARS,
		PLAN_PREMIUM_MONTHLY,
		PLAN_BUSINESS,
		PLAN_BUSINESS_2_YEARS,
		PLAN_BUSINESS_MONTHLY,
		PLAN_ECOMMERCE,
		PLAN_ECOMMERCE_2_YEARS,
		PLAN_ECOMMERCE_MONTHLY,
		PLAN_VIP,
		PLAN_WPCOM_SEARCH,
		PLAN_WPCOM_SEARCH_MONTHLY,
		PLAN_JETPACK_BACKUP_T0_YEARLY,
		PLAN_JETPACK_BACKUP_T0_MONTHLY,
		PLAN_JETPACK_BACKUP_T1_YEARLY,
		PLAN_JETPACK_BACKUP_T1_MONTHLY,
		PLAN_JETPACK_BACKUP_T2_YEARLY,
		PLAN_JETPACK_BACKUP_T2_MONTHLY,
		PLAN_JETPACK_SCAN,
		PLAN_JETPACK_SCAN_MONTHLY,
		PLAN_JETPACK_ANTI_SPAM,
		PLAN_JETPACK_ANTI_SPAM_MONTHLY,
		PLAN_JETPACK_SEARCH,
		PLAN_JETPACK_SEARCH_MONTHLY,
		PLAN_JETPACK_FREE,
		PLAN_JETPACK_PERSONAL,
		PLAN_JETPACK_PERSONAL_MONTHLY,
		PLAN_JETPACK_PREMIUM,
		PLAN_JETPACK_PREMIUM_MONTHLY,
		PLAN_JETPACK_BUSINESS,
		PLAN_JETPACK_BUSINESS_MONTHLY,
		PLAN_JETPACK_SECURITY_T1_YEARLY,
		PLAN_JETPACK_SECURITY_T1_MONTHLY,
		PLAN_JETPACK_SECURITY_T2_YEARLY,
		PLAN_JETPACK_SECURITY_T2_MONTHLY,
		PLAN_JETPACK_COMPLETE,
		PLAN_JETPACK_COMPLETE_MONTHLY,
		PLAN_JETPACK_VIDEOPRESS,
		PLAN_JETPACK_VIDEOPRESS_MONTHLY,

		// DEPRECATED: Daily and Real-time variations will soon be retired.
		// Remove after all customers are migrated to new products.
		PLAN_JETPACK_BACKUP_DAILY,
		PLAN_JETPACK_BACKUP_DAILY_MONTHLY,
		PLAN_JETPACK_BACKUP_REALTIME,
		PLAN_JETPACK_BACKUP_REALTIME_MONTHLY,
		PLAN_JETPACK_SECURITY_DAILY,
		PLAN_JETPACK_SECURITY_DAILY_MONTHLY,
		PLAN_JETPACK_SECURITY_REALTIME,
		PLAN_JETPACK_SECURITY_REALTIME_MONTHLY,
		PLAN_JETPACK_VIDEOPRESS,
		PLAN_JETPACK_VIDEOPRESS_MONTHLY,
	] ).isRequired,
};
