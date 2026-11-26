import requireSeoTools from '../../_inc/data/require-seo-tools';

// The GEO route hosts the llms.txt, AI SEO Enhancer and AI crawler controls. Its
// stage loads their data, so the route only guards on SEO tools.
export const route = {
	beforeLoad: requireSeoTools,
};
