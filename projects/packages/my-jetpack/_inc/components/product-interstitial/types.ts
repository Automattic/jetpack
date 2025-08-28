/**
  Configuration types for product pricing tables
 */
export interface FeatureTier {
	included: boolean;
	label: string;
}

export interface ProductFeature {
	name: string;
	tooltipInfo?: React.ReactNode;
	free?: FeatureTier;
	paid: FeatureTier;
	bundle: FeatureTier;
}

export interface ProductTier {
	name: string;
	cta: string;
}

export interface ProductConfig {
	title: string;
	logo: React.ComponentType< { height?: number } >;
	bundle: string;
	features: ProductFeature[];
	tiers: {
		free?: ProductTier;
		paid: ProductTier;
		bundle: ProductTier;
	};
}
