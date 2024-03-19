import { imagePath } from 'constants/urls';

export const PRODUCT_DESCRIPTION_PRODUCTS = {
	JETPACK_ANTI_SPAM: 'akismet',
	JETPACK_BACKUP: 'backup',
	JETPACK_PROTECT: 'protect',
	JETPACK_SCAN: 'scan',
	JETPACK_SEARCH: 'search',
	JETPACK_SECURITY: 'security',
	JETPACK_SOCIAL: 'social',
	JETPACK_VIDEOPRESS: 'videopress',
};

export const productDescriptionRoutes = [
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_ANTI_SPAM }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_BACKUP }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_PROTECT }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SCAN }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SEARCH }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SECURITY }`,
	`/product/${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_VIDEOPRESS }`,
];

export const myJetpackRoutes = [
	`/add-${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_ANTI_SPAM }`,
	`/add-${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_BACKUP }`,
	`/add-${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SCAN }`,
	`/add-${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_PROTECT }`,
	`/add-${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SEARCH }`,
	`/add-${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SOCIAL }`,
	`/add-${ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_VIDEOPRESS }`,
];

export const productIllustrations = {
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_ANTI_SPAM ]: `${ imagePath }products/illustration-anti-spam.png`,
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_BACKUP ]: `${ imagePath }products/illustration-backup.png`,
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_PROTECT ]: `${ imagePath }products/illustration-scan.png`,
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SCAN ]: `${ imagePath }products/illustration-scan.png`,
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SEARCH ]: `${ imagePath }products/illustration-search.png`,
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_SECURITY ]: `${ imagePath }products/illustration-scan.png`,
	[ PRODUCT_DESCRIPTION_PRODUCTS.JETPACK_VIDEOPRESS ]: `${ imagePath }products/illustration-videopress.png`,
};
