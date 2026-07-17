/**
 * Internal dependencies
 */
import completeImage from './assets/complete.webp';
import extrasImage from './assets/extras.png';
import securityImage from './assets/security.webp';
import statsImage from './assets/stats.png';
import PricingInterstitial from './pricing-interstitial';
import ProductInterstitial from './product-interstitial';

// Export the main components
export default ProductInterstitial;

/**
 * AntiSpamInterstitial component
 *
 * @return {object} AntiSpamInterstitial react component.
 */
export function AntiSpamInterstitial() {
	return <PricingInterstitial slug="anti-spam" />;
}

/**
 * BackupInterstitial component
 *
 * @return {object} BackupInterstitial react component.
 */
export function BackupInterstitial() {
	return <PricingInterstitial slug="backup" />;
}

/**
 * BoostInterstitial component
 *
 * @return {object} BoostInterstitial react component.
 */
export function BoostInterstitial() {
	return <PricingInterstitial slug="boost" />;
}

/**
 * CRMInterstitial component
 *
 * @return {object} CRMInterstitial react component.
 */
export function CRMInterstitial() {
	return <PricingInterstitial slug="crm" />;
}

/**
 * ExtrasInterstitial component
 *
 * @return {object} ExtrasInterstitial react component.
 */
export function ExtrasInterstitial() {
	return (
		<ProductInterstitial slug="extras" installsPlugin={ true }>
			<img src={ extrasImage } alt="Extras" />
		</ProductInterstitial>
	);
}

/**
 * JetpackAiInterstitial component
 *
 * @return {object} JetpackAiInterstitial react component.
 */
export function JetpackAiInterstitial() {
	return <PricingInterstitial slug="jetpack-ai" />;
}

/**
 * ProtectInterstitial component
 *
 * @return {object} ProtectInterstitial react component.
 */
export function ProtectInterstitial() {
	return <PricingInterstitial slug="protect" />;
}

/**
 * ScanInterstitial component
 *
 * @return {object} ScanInterstitial react component.
 */
export function ScanInterstitial() {
	return <ProductInterstitial slug="scan" installsPlugin={ true } bundle="security" />;
}

/**
 * SocialInterstitial component
 *
 * @return {object} SocialInterstitial react component.
 */
export function SocialInterstitial() {
	return <PricingInterstitial slug="social" />;
}

/**
 * SearchInterstitial component
 *
 * @return {object} SearchInterstitial react component.
 */
export function SearchInterstitial() {
	return <PricingInterstitial slug="search" />;
}

/**
 * StatsInterstitial component
 *
 * @return {object} StatsInterstitial react component.
 */
export function StatsInterstitial() {
	return <PricingInterstitial slug="stats" />;
}

/**
 * VideoPressInterstitial component
 *
 * @return {object} VideoPressInterstitial react component.
 */
export function VideoPressInterstitial() {
	return <PricingInterstitial slug="videopress" />;
}

/**
 * SecurityInterstitial component
 *
 * @return {object} SecurityInterstitial react component.
 */
export function SecurityInterstitial() {
	return (
		<ProductInterstitial slug="security" installsPlugin={ true }>
			<img src={ securityImage } alt="Security" />
		</ProductInterstitial>
	);
}

/**
 * GrowthInterstitial component
 *
 * @return {object} GrowthInterstitial react component.
 */
export function GrowthInterstitial() {
	return (
		<ProductInterstitial slug="growth" installsPlugin={ true }>
			<img src={ statsImage } alt="Growth" />
		</ProductInterstitial>
	);
}

/**
 * CompleteInterstitial component
 *
 * @return {object} CompleteInterstitial react component.
 */
export function CompleteInterstitial() {
	return (
		<ProductInterstitial slug="complete" installsPlugin={ true }>
			<img src={ completeImage } alt="Complete" />
		</ProductInterstitial>
	);
}
