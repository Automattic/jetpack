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
};
