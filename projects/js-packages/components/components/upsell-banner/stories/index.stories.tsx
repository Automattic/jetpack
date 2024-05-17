import UpsellBanner from '..';
import logoSample from './jetpack-manage.svg';

export default {
	title: 'JS Packages/Components/Upsell Banner',
	component: UpsellBanner,
	parameters: {
		layout: 'centered',
	},
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BannerTemplate = args => {
	// Set up the first CTA
	const secondaryCtaLabel = 'Learn more';
	const secondaryCtaUrl = 'my-jetpack-jetpack-manage-learn-more';

	// Set up the second CTA
	const primaryCtaLabel = 'Manage sites';
	const primaryCtaUrl = 'my-jetpack-jetpack-manage-dashboard';

	return (
		<UpsellBanner
			icon={ args.showIcon ? logoSample : null }
			title="Jetpack Manage"
			description="Jetpack Manage has the tools you need to manage multiple WordPress sites. Monitor site security, performance, and traffic, and get alerted if a site needs attention. Plus, get bulk discounts."
			secondaryCtaLabel={ args.showSecondary ? secondaryCtaLabel : null }
			secondaryCtaURL={ args.showSecondary ? secondaryCtaUrl : null }
			secondaryCtaIsExternalLink={ true }
			primaryCtaLabel={ args.showPrimary ? primaryCtaLabel : null }
			primaryCtaURL={ args.showPrimary ? primaryCtaUrl : null }
			primaryCtaIsExternalLink={ true }
		/>
	);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CompleteBanner = args => {
	const props = {
		showIcon: true,
		showSecondary: true,
		showPrimary: true,
	};
	return <BannerTemplate { ...props } />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WithoutIcon = args => {
	const props = {
		showIcon: false,
		showSecondary: true,
		showPrimary: true,
	};
	return <BannerTemplate { ...props } />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WithoutPrimaryBtn = args => {
	const props = {
		showIcon: true,
		showSecondary: true,
		showPrimary: false,
	};
	return <BannerTemplate { ...props } />;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WithoutSecondaryBtn = args => {
	const props = {
		showIcon: true,
		showSecondary: false,
		showPrimary: true,
	};
	return <BannerTemplate { ...props } />;
};
