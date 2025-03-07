import SessionsReport from '..';

export default {
	title: 'JS Packages/Components/Sessions Report',
	component: SessionsReport,
	parameters: {
		backgrounds: {
			default: 'light',
			values: [ { name: 'light', value: 'white' } ],
		},
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '100%', backgroundColor: 'white' } }>
				<Story />
			</div>
		),
	],
};

// Sample data for the stories
const DATA = [
	{
		userId: 1,
		userLogin: 'user1',
		userRoles: [ 'administrator' ],
		isSuspicious: false,
		lastAction: 'auth_cookie_valid',
		ip: '192.168.1.1',
		login: 1741361961, // 2025-07-05 12:32:41 UTC
		expiration: 1741365561, // 2025-07-05 13:32:41 UTC
		ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
		token: 'token1',
	},
	{
		userId: 2,
		userLogin: 'user2',
		userRoles: [ 'editor', 'wp_custom_role' ],
		isSuspicious: false,
		lastAction: 'auth_cookie_valid',
		ip: '192.168.1.2',
		login: 1741358361, // 2025-07-05 11:32:41 UTC
		expiration: 1741361961, // 2025-07-05 12:32:41 UTC
		ua: 'Chrome/98.0.4758.102 Safari/537.36',
		token: 'token2',
	},
	{
		userId: 3,
		userLogin: 'user3',
		userRoles: [ 'editor', 'subscriber' ],
		isSuspicious: true,
		lastAction: 'auth_cookie_bad_hash',
		ip: '192.168.1.3',
		login: 1741354761, // 2025-07-05 10:32:41 UTC
		expiration: 1741358361, // 2025-07-05 11:32:41 UTC
		ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
		token: 'token3',
	},
	{
		userId: 4,
		userLogin: '',
		userRoles: [],
		isSuspicious: true,
		lastAction: 'auth_cookie_bad_session_token',
		ip: '192.168.1.4',
		login: 1741351161, // 2025-07-05 09:32:41 UTC
		expiration: 1741354761, // 2025-07-05 10:32:41 UTC
		ua: 'Opera/12.14 (Windows NT 6.1; U; en) Presto/2.12.388 Version/12.14',
		token: 'token4',
	},
];

const USER_IDS = Array.from( { length: 25 }, () => Math.floor( Math.random() * 50 ) + 1 );

const ACTIONS = [
	'auth_cookie_expired',
	'auth_cookie_bad_username',
	'auth_cookie_bad_hash',
	'auth_cookie_bad_session_token',
	'auth_cookie_valid',
	'set_logged_in_cookie',
];

const ROLES = [
	'administrator',
	'editor',
	'author',
	'contributor',
	'subscriber',
	'wp_custom_role',
];

const USER_AGENTS = [
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
	'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
	'Opera/12.14 (Windows NT 6.1; U; en) Presto/2.12.388 Version/12.14',
	'Safari/604.1 CFNetwork/1206 Darwin/20.1.0',
	'Chrome/98.0.4758.102 Safari/537.36',
	'Edge/97.0.1072.69 Safari/537.36',
];

/**
 * Generate random roles.
 *
 * @return {string[]} The generated roles.
 */
function generateRandomRoles() {
	const numRoles = Math.floor( Math.random() * 3 ) + 1; // Between 1 and 3 roles
	return [
		...new Set(
			Array.from( { length: numRoles }, () => ROLES[ Math.floor( Math.random() * ROLES.length ) ] )
		),
	];
}

/**
 * Generate a random action.
 *
 * @return {string} The generated action.
 */
function generateRandomAction() {
	return ACTIONS[ Math.floor( Math.random() * ACTIONS.length ) ];
}

/**
 * Generate a random user agent.
 *
 * @return {string} The generated user agent.
 */
function generateRandomUserAgent() {
	return USER_AGENTS[ Math.floor( Math.random() * USER_AGENTS.length ) ];
}

export const Default = args => <SessionsReport { ...args } />;
Default.args = {
	data: DATA,
	terminateSessions: ( userSessionTokens: { userId: number; tokens: string[] }[] ) => {
		const formattedSessions = userSessionTokens
			.map( session => `User ${ session.userId }: [ ${ session.tokens.join( ', ' ) } ]` )
			.join( '\n' );

		alert( `Terminating sessions:\n${ formattedSessions }` ); // eslint-disable-line no-alert
	},
	getProfileLink: userId => {
		return `/wp-admin/user-edit.php?user_id=${ userId }`;
	},
};

export const Empty = args => <SessionsReport { ...args } />;
Empty.args = {
	data: [],
	getProfileLink: userId => {
		return `/wp-admin/user-edit.php?user_id=${ userId }`;
	},
};

export const MultipleSessions = args => <SessionsReport { ...args } />;
MultipleSessions.args = {
	data: Array.from( { length: 25 }, ( _, index ) => {
		const userId = USER_IDS[ Math.floor( Math.random() * USER_IDS.length ) ];
		const lastAction = generateRandomAction();

		return {
			userId: userId,
			userLogin: ( index + 1 ) % 10 === 0 ? '' : `user${ userId }`,
			userRoles:
				( index + 1 ) % 10 === 0
					? []
					: generateRandomRoles().sort( ( a, b ) => {
							return ROLES.indexOf( a ) - ROLES.indexOf( b );
					  } ),
			isSuspicious: [ 'auth_cookie_bad_username' ].includes( lastAction ),
			lastAction: lastAction,
			ip: `192.168.1.${ index + 1 }`,
			login: 1741354761 - index * 3600, // Starting from 2025-07-05 10:32:41 UTC
			expiration: 1741354761 - ( index - 1 ) * 3600, // Each session expires 1 hour after login
			ua: generateRandomUserAgent(),
			token: `token${ index + 1 }`,
		};
	} ),
	terminateSessions: ( userSessionTokens: { userId: number; tokens: string[] }[] ) => {
		const formattedSessions = userSessionTokens
			.map( session => `User ${ session.userId }: [${ session.tokens.join( ', ' ) }]` )
			.join( '\n' );

		alert( `Terminating sessions:\n${ formattedSessions }` ); // eslint-disable-line no-alert
	},
	getProfileLink: userId => {
		return `/wp-admin/user-edit.php?user_id=${ userId }`;
	},
};
