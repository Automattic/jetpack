import { REST_NAMESPACE } from '../constants';
import useSimpleMutation from './use-simple-mutation';
import useSimpleQuery from './use-simple-query';
import type { SitemapResponse } from './sitemap-types';

export const useSitemap = () =>
	useSimpleQuery< SitemapResponse >( {
		name: 'jetpack-seo-sitemap',
		query: { path: `/${ REST_NAMESPACE }/sitemap` },
	} );

export const useUpdateSitemap = () =>
	useSimpleMutation< SitemapResponse, { enabled: boolean } >( {
		name: 'jetpack-seo-sitemap-update',
		query: { path: `/${ REST_NAMESPACE }/sitemap`, method: 'POST' },
		invalidates: [ 'jetpack-seo-sitemap', 'jetpack-seo-overview' ],
	} );
