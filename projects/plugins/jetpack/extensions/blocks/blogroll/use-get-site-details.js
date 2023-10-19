import { useSite } from './use-fetch';
import { getSiteIcon, getValidDomain } from './utils';

export default function useGetSiteDetails( { siteURL, subscriptions, enabled = false } ) {
	const validDomain = getValidDomain( siteURL );

	const { response: wpcomSite, isLoading } = useSite( validDomain, Boolean( enabled ) );

	const results = subscriptions.filter( item =>
		`${ item.name }${ item.URL }`.match( new RegExp( siteURL, 'i' ) )
	);

	if ( wpcomSite ) {
		results.unshift( {
			id: wpcomSite?.ID,
			description: wpcomSite?.description,
			URL: wpcomSite?.URL,
			site_icon: getSiteIcon( wpcomSite?.logo?.url ),
			name: wpcomSite?.name,
		} );
	}
	return { isLoading, siteDetails: results };
}
