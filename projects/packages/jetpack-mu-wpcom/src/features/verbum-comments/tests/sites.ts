/**
 * Verbum is served from a WordPress.com Simple site on every platform: rendered in the
 * page on Simple itself, and embedded from jetpack.wordpress.com on Atomic and
 * self-hosted. A surface describes what differs around it, so one spec covers all three.
 */

export type Scenario = 'open_comments' | 'require_name_email' | 'require_login';

/** These depend on the site's discussion settings, so their specs skip when unconfigured. */
type OptionalScenario = Exclude< Scenario, 'open_comments' >;

export interface Surface {
	name: string;
	/** Verbum arrives in the jetpack.wordpress.com iframe rather than rendering in the page. */
	iframe: boolean;
	/** `should_load_gutenberg_comments()` returns false for blog 522232, so for every iframe request. */
	blocksEnabled: boolean;
	posts: { open_comments: string } & Partial< Record< OptionalScenario, string > >;
}

// The monorepo's shared `process` declaration only covers NODE_ENV.
const env = process.env as Record< string, string | undefined >;
const { VERBUM_SELFHOSTED_URL, VERBUM_SELFHOSTED_NAME_EMAIL_URL, VERBUM_SELFHOSTED_LOGIN_URL } =
	env;

const surfaces: Surface[] = [
	{
		name: 'simple',
		iframe: false,
		blocksEnabled: true,
		posts: {
			open_comments: 'https://e2esiteopencommentstoeveryone.wordpress.com/2023/12/10/hello-world/',
			require_name_email:
				'https://e2ecommentauthormustfilloutnameandemail.wordpress.com/2023/12/10/hello-world/',
			require_login:
				'https://e2eusersmustberegisteredandloggedintocomment.wordpress.com/2023/12/10/hello-world/',
		},
	},
	{
		name: 'atomic',
		iframe: true,
		blocksEnabled: false,
		posts: {
			open_comments:
				'https://e2esiteopencommentstoeveryoneatomic.wpcomstaging.com/2023/12/10/hello-world/',
			require_name_email:
				'https://e2ecommentauthormustfilloutnameandemailatomic.wpcomstaging.com/2023/12/10/hello-world/',
			require_login:
				'https://e2eusersmustberegisteredandloggedintocommentatomic.wpcomstaging.com/2023/12/10/hello-world/',
		},
	},
];

/*
 * Self-hosted has no permanent test site, so it is opt-in. Point these at a
 * Jetpack-connected site and the surface joins the run; leave them unset and it drops
 * out without failing the others. See README.md § Testing for the setup.
 */
if ( VERBUM_SELFHOSTED_URL ) {
	surfaces.push( {
		name: 'selfhosted',
		iframe: true,
		blocksEnabled: false,
		posts: {
			open_comments: VERBUM_SELFHOSTED_URL,
			...( VERBUM_SELFHOSTED_NAME_EMAIL_URL && {
				require_name_email: VERBUM_SELFHOSTED_NAME_EMAIL_URL,
			} ),
			...( VERBUM_SELFHOSTED_LOGIN_URL && { require_login: VERBUM_SELFHOSTED_LOGIN_URL } ),
		},
	} );
}

export default surfaces;
