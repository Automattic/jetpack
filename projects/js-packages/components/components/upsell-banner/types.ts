export type UpsellBannerProps = {
	icon?: string;
	title: string;
	description: string;
	primaryCtaLabel?: string;
	primaryCtaURL?: string;
	primaryCtaIsExternalLink?: boolean;
	primaryCtaOnClick?: () => void;
	secondaryCtaLabel?: string;
	secondaryCtaURL?: string;
	secondaryCtaIsExternalLink?: boolean;
	secondaryCtaOnClick?: () => void;
	/** Renders a dismiss button in the top corner of the banner when provided. */
	onDismiss?: () => void;
	/** Accessible label for the dismiss button. Defaults to "Dismiss". */
	dismissLabel?: string;
};
