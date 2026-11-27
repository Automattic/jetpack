/**
 * The dashboard's hashbang routes, in the order `apps/blaze-dashboard/src/routes.js` registered them.
 */
import { type ReactElement } from 'react';
import config from '../compat/config';
import { getSelectedSiteId } from '../compat/state';
import BlazePressWidget from '../components/blazepress-widget';
import CampaignItemPage from '../promote-post-i2/components/campaign-item-page';
import PromotedPosts, { TAB_OPTIONS, type TabType } from '../promote-post-i2/main';
import { getAdvertisingDashboardPath, getWidgetParams } from '../promote-post-i2/utils';
import BlazeSetup from './pages/setup/main';

type Params = Record< string, string >;
type Query = Record< string, string >;

export type RouteResult = { element: ReactElement } | { redirect: string };

type Route = {
	pattern: string;
	render: ( params: Params, query: Query ) => RouteResult;
};

const P = ( path: string ) => getAdvertisingDashboardPath( path );

const promotedPosts = ( { tab, receiptId }: Params ): RouteResult => ( {
	// Viewing a receipt forces the payments tab.
	element: (
		<PromotedPosts
			tab={ ( receiptId ? 'payments' : tab ) as TabType }
			receiptId={ receiptId ? Number( receiptId ) : undefined }
		/>
	),
} );

const promoteWidget = ( { item }: Params, query: Query ): RouteResult => {
	const { selectedPostId, selectedCampaignId } = getWidgetParams( item );
	return {
		element: (
			<BlazePressWidget
				isVisible
				siteId={ getSelectedSiteId() }
				postId={ selectedPostId }
				campaignId={ selectedCampaignId }
				keyValue={ item }
				source={ query.source }
			/>
		),
	};
};

/**
 * Build the route table; the prefix depends on the boot config.
 *
 * @return Routes.
 */
export function getRoutes(): Route[] {
	return [
		{
			pattern: P( '/setup/:site' ),
			render: () => ( { element: <BlazeSetup setupInfo={ config( 'need_setup' ) } /> } ),
		},
		{ pattern: P( '/:site' ), render: promotedPosts },
		{
			pattern: P( '/:tab/:site' ),
			render: params => {
				const { site, tab } = params;
				const tabs = TAB_OPTIONS as readonly string[];
				// Compatibility: the tab and site used to be the other way round.
				if ( ! tabs.includes( tab ) && tabs.includes( site ) ) {
					return { redirect: P( `/${ site }/${ tab }` ) };
				}
				return promotedPosts( params );
			},
		},
		{
			pattern: P( '/campaigns/:campaignId/:site' ),
			render: ( { campaignId } ) => ( {
				element: <CampaignItemPage campaignId={ Number( campaignId ) } />,
			} ),
		},
		{ pattern: P( '/promote/:item/:site' ), render: promoteWidget },
		{ pattern: P( '/:tab/promote/:item/:site' ), render: promoteWidget },
		{ pattern: P( '/payments/receipt/:receiptId/:site?' ), render: promotedPosts },
		{
			// Compatibility: redirect the old navigation style.
			pattern: P( '/:site/:tab/promote/:item' ),
			render: ( { site, tab, item } ) => ( {
				redirect: P( `/${ tab }/promote/${ item }/${ site }` ),
			} ),
		},
	];
}

/**
 * Apply the setup-mode redirects from `routes.js`.
 *
 * @param pathname - Current path.
 * @return Redirect target, or null.
 */
export function getSetupRedirect( pathname: string ): string | null {
	const setupPath = P( '/setup/' );
	const inSetup = pathname.includes( setupPath );
	const setupMode = config.isEnabled( 'blaze_setup_mode' );
	if ( inSetup && ! setupMode ) {
		return P( `/${ config( 'hostname' ) }` );
	}
	if ( ! inSetup && setupMode ) {
		return P( `/setup/${ config( 'hostname' ) }` );
	}
	return null;
}

/**
 * Swap a wrong first segment for the configured prefix, as `lib/fix-path.js` did.
 *
 * @param path - Hash path.
 * @return Fixed path.
 */
export function fixPath( path: string ): string {
	const prefix = config( 'advertising_dashboard_path_prefix' );
	if ( path && ! path.startsWith( prefix ) ) {
		const segments = path.split( '/' );
		if ( segments.length > 1 ) {
			return path.replace( `/${ segments[ 1 ] }`, prefix );
		}
	}
	return path;
}
