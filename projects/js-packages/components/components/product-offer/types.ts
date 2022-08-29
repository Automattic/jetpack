import { ProductPriceProps } from '../product-price/types';
import type { JetpackIconSlug } from '../icons';

export type ProductOfferProps = {
	/**
	 * Product slug.
	 */
	slug?: JetpackIconSlug;

	/**
	 * Product name.
	 */
	name?: string;

	/**
	 * Custom Icon slug.
	 */
	icon?: JetpackIconSlug;

	/**
	 * Product title.
	 */
	title?: string;

	/**
	 * Product sub-title.
	 */
	subTitle?: string;

	/**
	 * Product description.
	 */
	description?: string;

	/**
	 * Features list of the product.
	 */
	features?: Array< string >;

	/**
	 * Add the styles to look like a card.
	 */
	isCard?: boolean;

	/**
	 * Whether or not the product is a bundle.
	 */
	isBundle?: boolean;

	/**
	 * List of supported products (for bundles).
	 */
	supportedProducts?: Array< JetpackIconSlug >;

	/**
	 * Product Pricing object.
	 */
	pricing?: Pricing;

	/**
	 * Whether or not the product has the required plan.
	 */
	hasRequiredPlan?: boolean;

	/**
	 * Applies the isLoading style to the component.
	 */
	isLoading?: boolean;

	/**
	 * A className to be concat with default ones.
	 */
	className?: string;

	/**
	 * Callback function to be executed on click on Add button.
	 */
	onAdd?: VoidFunction;

	/**
	 * The checkout URL to add/buy the product.
	 */
	addProductUrl?: string;

	/**
	 * The text to be displayed on the Add button.
	 */
	buttonText?: string;

	/**
	 * Content displayed below the Add button.
	 */
	buttonDisclaimer?: React.ReactNode;

	/**
	 * Error message.
	 */
	error?: string;
};

export type Pricing = Pick< ProductPriceProps, 'currency' | 'offPrice' | 'price' > & {
	/**
	 * Whether it is a free product
	 */
	isFree?: boolean;
};

export type IconsCardProps = {
	/**
	 * Custom icon slug.
	 */
	icon: JetpackIconSlug;

	/**
	 * List of supported products.
	 */
	products: Array< JetpackIconSlug >;

	/**
	 * Icon size.
	 */
	size: number;
};

export type ProductOfferHeaderProps = Pick< ProductOfferProps, 'title' >;
