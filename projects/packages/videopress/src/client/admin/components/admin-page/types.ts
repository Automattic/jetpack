import { LocalVideo, MetadataVideo, VideoPressVideo } from '../../types';

export type siteProductOriginalProps = {
	title: string;
	name: string;
	description: string;
	long_description?: string;
	features: Array< string >;
	has_required_plan: boolean;
	is_bundle?: boolean;
	is_upgradable_by_bundle?: boolean;
	manage_url?: string;
	plugin_slug: string;
	post_activation_url?: string;
	pricing_for_ui: {
		available: boolean;
		currency_code: string;
		discount_price: number;
		full_price: number;
		wpcom_product_slug: string;
	};
	requires_user_connection: boolean;
	slug: string;
	status: string;
	supported_products: Array< string >;
	wpcom_product_slug: string;
};

export type productOriginalProps = {
	product_id: number;
	product_name: string;
	product_slug: 'jetpack_videopress';
	description: string;
	available: boolean;
	billing_product_slug: 'jetpack-videopress';
	is_domain_registration: false;
	cost_display: string;
	combined_cost_display: string;
	cost: number;
	cost_smallest_unit: number;
	currency_code: string;
	product_term: string;
	price_tier_slug: string;
	introductory_offer: {
		interval_unit: string;
		interval_count: number;
		cost_per_interval: number;
		transition_after_renewal_count: number;
		should_prorate_when_offer_ends: boolean;
	};
};

export type productPriceOriginalProps = {
	yearly: {
		name: string;
		slug: string;
		price: number;
		salePrice: number;
		priceByMonth: number;
		salePriceByMonth: number;
		currency: string;
		discount: number;
	};
	monthly: {
		price: number;
		currency: string;
	};
};

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
		jetpackVideoPressInitialState?: {
			allowedVideoExtensions: Record< string, string >;
			registrationNonce: string;
			siteProductData: siteProductOriginalProps;
			productData?: productOriginalProps;
			productPrice?: productPriceOriginalProps;
			contentNonce: string;
			initialState: {
				videos?: {
					isFetching?: boolean;
				};
			};
		};
	}
}

export type VideoLibraryProps = {
	videos: Array< VideoPressVideo & MetadataVideo >;
	totalVideos?: number;
	loading?: boolean;
};

export type LocalLibraryProps = {
	videos: Array< LocalVideo >;
	totalVideos?: number;
	loading?: boolean;
	uploading?: boolean;
	onUploadClick?: ( video: LocalVideo ) => void;
};

export interface ConnectionStore {
	getConnectionStatus: () => {
		isUserConnected: boolean;
		isRegistered: boolean;
	};
}
