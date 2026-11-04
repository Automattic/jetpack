const STANDARD_ENTRY_POINT_PATTERN = /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/;
const STANDARD_ENTRY_POINT_MAX_LENGTH = 64;

// My Jetpack slugs that drop a `jetpack-` prefix or a tab's suffix, so each product has one name.
const SLUG_OVERRIDES: Record< string, string > = {
	'jetpack-ai': 'ai',
	'jetpack-forms': 'forms',
	'protect-dashboard': 'protect',
};

const toNamePart = ( slug: string ): string =>
	( SLUG_OVERRIDES[ slug ] ?? slug ).replace( /-/g, '_' );

/**
 * The `from` each connect link sends to WordPress.com, which counts connections and picks its screen by it.
 *
 * Every Jetpack entry point's name lives here: add a new one in the format `isStandardEntryPoint()` accepts.
 * Never rename a shipped name, or reuse another surface's.
 */
export const CONNECTION_FROM = {
	// Kept name of My Jetpack's onboarding takeover: My Jetpack starts its tour when it comes back.
	jetpackOnboarding: 'jetpack-onboarding',
	myJetpackOnboarding: 'my_jetpack_onboarding',
	myJetpackConnectionScreen: 'my_jetpack_connection_screen',
	myJetpackNoticeUser: 'my_jetpack_notice_user',
	myJetpackNoticeSite: 'my_jetpack_notice_site',
	myJetpackNoticeReconnect: 'my_jetpack_notice_reconnect',
	myJetpackHeader: 'my_jetpack_header',
	myJetpackHeaderReconnect: 'my_jetpack_header_reconnect',
	myJetpackHeaderPlans: 'my_jetpack_header_plans',
	myJetpackConnectionCard: 'my_jetpack_connection_card',
	myJetpackConnectionCardReconnect: 'my_jetpack_connection_card_reconnect',
	myJetpackPlans: 'my_jetpack_plans',
	myJetpackProducts: ( slug: string ) => `my_jetpack_products_${ toNamePart( slug ) }`,
	myJetpackRecommendations: ( slug: string ) =>
		`my_jetpack_recommendations_${ toNamePart( slug ) }`,
	myJetpackFeatures: ( slug: string ) => `my_jetpack_features_${ toNamePart( slug ) }`,
	myJetpackOverview: ( slug: string ) => `my_jetpack_overview_${ toNamePart( slug ) }`,
} as const;

// Both functions below mirror https://github.com/Automattic/wp-calypso/blob/99b8d308db6/client/jetpack-connect/entry-points.ts

/**
 * Whether `from` is in the standard format, `owner_surface[_detail]`: snake_case, at most 64 characters.
 *
 * @param from - The `from` value.
 * @return Whether it is a standard name.
 */
export function isStandardEntryPoint( from?: string | null ): boolean {
	return (
		typeof from === 'string' &&
		from.length <= STANDARD_ENTRY_POINT_MAX_LENGTH &&
		STANDARD_ENTRY_POINT_PATTERN.test( from )
	);
}

/**
 * Whether `from` gets WordPress.com's unified connection screen: a standard name, or one of two kept names.
 *
 * @param from - The `from` value.
 * @return Whether the flow is unified.
 */
export function isUnifiedConnectionFlow( from?: string | null ): boolean {
	return (
		from === 'jetpack-connector' ||
		from === CONNECTION_FROM.jetpackOnboarding ||
		isStandardEntryPoint( from )
	);
}
