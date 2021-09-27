/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

export const PRODUCT_DESCRIPTION_PRODUCTS = {
	JETPACK_ANTI_SPAM: 'jetpack-anti-spam',
	JETPACK_BACKUP_DAILY: 'jetpack-backup-daily',
	JETPACK_SCAN: 'jetpack-scan',
	JETPACK_SEARCH: 'jetpack-search',
};

export const productDescriptionRoutes = [
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_ANTI_SPAM }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_BACKUP_DAILY }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SCAN }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SEARCH }`,
];

export const productIllustrations = {
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_ANTI_SPAM ]:
		imagePath + 'products/illustration-anti-spam.png',
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_BACKUP_DAILY ]:
		imagePath + 'products/illustration-backup.png',
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SCAN ]: imagePath + 'products/illustration-scan.png',
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SEARCH ]: imagePath + 'products/illustration-search.png',
};
