import encoding from 'k6/encoding';

export const encodedCredentials = encoding.b64encode(
	// eslint-disable-next-line no-undef
	`${ __ENV.JETPACKSTAGING_K6_USERNAME }:${ __ENV.JETPACKSTAGING_K6_PASSWORD }`
);

/**
 * WoA test sites updated with latest monorepo trunk builds.
 */
export const sites = [
	{
		url: 'https://jetpackedge.wpcomstaging.com',
		note: 'normal site',
		blog_id: '215379549',
	},
	{
		url: 'https://jetpackedgephp74.wpcomstaging.com',
		note: 'php 7.4',
		blog_id: '215379848',
	},
	{
		url: 'https://jetpackedgephp82.wpcomstaging.com',
		note: 'php 8.2',
		blog_id: '215380000',
	},
	{
		url: 'https://jetpackedgeecomm.wpcomstaging.com',
		note: 'ecommerce plan',
		blog_id: '215380391',
	},
	{
		url: 'https://jetpackedgeprivate.wpcomstaging.com',
		note: 'private site',
		blog_id: '215380534',
	},
	{
		url: 'https://jetpackedgewpbeta.wpcomstaging.com',
		note: 'latest wp beta',
		blog_id: '215380197',
	},
	{
		url: 'https://jetpackedgewpprevious.wpcomstaging.com',
		note: 'previous wp version',
		blog_id: '215380213',
	},
];
