import requireSeoTools from '../../_inc/data/require-seo-tools';

// Overview is the default SEO route (the bare page URL), so with SEO tools off the page opens on Settings.
export const route = {
	beforeLoad: requireSeoTools,
};
