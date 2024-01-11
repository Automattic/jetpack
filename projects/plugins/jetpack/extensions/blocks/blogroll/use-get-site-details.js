import { useSite } from './use-fetch';
import { getSiteIcon, getValidDomain } from './utils';

export default function useGetSiteDetails( { siteURL, subscriptions, enabled = false } ) {
	const validDomain = getValidDomain( siteURL );

	const { response: wpcomSite, isLoading } = useSite( validDomain, Boolean( enabled ) );

	const results = [
		...( wpcomSite
			? [
					{
						blog_id: wpcomSite?.ID.toString(),
						description: wpcomSite?.description,
						URL: wpcomSite?.URL,
						site_icon: getSiteIcon( wpcomSite?.logo?.url ),
						name: wpcomSite?.name,
					},
			  ]
			: [] ),
		...subscriptions,
	].filter( item => `${ item.name }${ item.URL }`.match( new RegExp( siteURL, 'i' ) ) );

	if ( results.length === 0 && validDomain ) {
		results.unshift( {
			blog_id: validDomain,
			description: '',
			URL: validDomain,
			site_icon: getSiteIcon( null ),
			name: validDomain,
			is_non_wpcom_site: true,
		} );
	}
	return { isLoading, siteDetails: results };
}
