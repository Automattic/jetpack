/**
 * Map specific teams to one or more labels that may be added to issues.
 * The key is a feature name.
 * For each feature, we can define:
 * - a team name as specified in the "Team" field of a GitHub Project Board.
 * - an array of labels that this team wants to be notified about.
 * - a Slack channel ID if the team wants to be notified of high/blocker priority issues in a specific Slack channel.
 * - a project board ID if the team would like issues to be automatically added to a specific project board.
 */
export const automatticAssignments = {
	// WordPress.com Division.
	'Blogging Prompts': {
		team: 'Loop',
		labels: [ '[Block] Blogging Prompt' ],
		slack_id: 'C03NLNTPZ2T',
		board_id: 'https://github.com/orgs/Automattic/projects/448',
	},
	'Earn Features': {
		team: 'Gold',
		labels: [ 'Earn', '[Block] Paid Content', '[Block] Payments', '[Feature] Memberships' ],
		slack_id: 'C01B6KEJ5GE',
		board_id: 'https://github.com/orgs/Automattic/projects/718',
	},
	Reader: {
		team: 'Loop',
		labels: [ '[Feature] Reader' ],
		slack_id: 'C03NLNTPZ2T',
		board_id: 'https://github.com/orgs/Automattic/projects/448',
	},
	'Site Migrations': {
		team: 'Serenity',
		labels: [ '[Feature] Site Migration' ],
		slack_id: 'C0Q664T29',
		board_id: 'https://github.com/orgs/Automattic/projects/964/',
	},
	Themes: {
		team: 'Marvel',
		labels: [
			'[Feature Group] Appearance & Themes',
			'[Feature] Global Styles',
			'[Feature] Premium Automattic Themes',
			'[Feature] Free Automattic Themes',
			'[Feature] Third-Party Themes',
			'[Feature] .Org Themes',
			'[Feature] Customizer',
			'[Feature] Theme Showcase',
			'[Feature] Headstart',
			'[Feature] Google Fonts',
		],
		slack_id: 'C048CUFRGFQ',
		board_id: 'https://github.com/orgs/Automattic/projects/1106/',
	},
	ActivityPub: {
		team: 'Fediverse',
		labels: [
			'[Feature] Federated comments',
			'[Block] Federated reply',
			'[Block] Follow Me',
			'[Block] Followers',
			'[Block] Post settings',
			'[Block] Remote Reply',
		],
		board_id: 'https://github.com/orgs/Automattic/projects/1208/',
	},
	// Jetpack Division.
	'AI Tools': {
		team: 'Agora',
		labels: [
			'[Block] AI Assistant',
			'[Extension] AI Content Lens',
			'[Extension] AI Assistant',
			'[Extension] AI Assistant Plugin',
			'[AI Feature] AI Extension',
			'[Package] AI',
			'[JS Package] AI Client',
		],
		slack_id: 'C054LN8RNVA',
		board_id: 'https://github.com/orgs/Automattic/projects/667',
	},
	Akismet: {
		team: 'Akismet',
		labels: [ '[Feature] Akismet' ],
		slack_id: 'C029E4HPT',
	},
	Backups: {
		team: 'Backup',
		labels: [
			'[Plugin] Backup',
			'[Plugin] VaultPress',
			'[Feature] Backup & Scan',
			'[Feature] Backups',
			'[Package] Backup',
			'[Package] Transport Helper',
		],
		slack_id: 'CS8UYNPEE',
		board_id: 'https://github.com/orgs/Automattic/projects/766',
	},
	Boost: {
		team: 'Heart of Gold',
		labels: [
			'[Plugin] Boost',
			'[Boost Feature] Lazy Images',
			'[Boost Feature] Image Guide',
			'[Boost Feature] Image Size Analysis',
		],
		slack_id: 'C016BBAFHHS',
		board_id: 'https://github.com/orgs/Automattic/projects/548',
	},
	'Blocks infrastructure': {
		team: 'Vulcan',
		labels: [ '[Package] Blocks', '[Focus] FSE', '[Focus] Blocks' ],
		slack_id: 'C05PV073SG3',
		board_id: 'https://github.com/orgs/Automattic/projects/778',
	},
	Connection: {
		team: 'Vulcan',
		labels: [ '[Package] Connection', '[Package] Identity Crisis', '[Package] Sync' ],
		slack_id: 'C05PV073SG3',
		board_id: 'https://github.com/orgs/Automattic/projects/778',
	},
	CRM: {
		team: 'Avengers',
		labels: [ '[Plugin] CRM' ],
		slack_id: 'CTXBP902X',
		board_id: 'https://github.com/orgs/Automattic/projects/524',
	},
	'Monorepo tooling': {
		team: 'Jetpack Monorepo',
		labels: [ '[Tools] Development CLI', 'Actions', '[Package] Autoloader' ],
		slack_id: 'C05Q5HSS013', // #jetpack-monorepo
		board_id: 'https://github.com/orgs/Automattic/projects/599',
	},
	'My Jetpack': {
		team: 'Jetpack MarTech',
		labels: [ '[Package] My Jetpack' ],
		slack_id: 'C06CVN9QVFY',
		board_id: 'https://github.com/orgs/Automattic/projects/724',
	},
	Newsletter: {
		team: 'Loop',
		labels: [
			'[Block] Subscriptions',
			'[Block] Paywall',
			'[Block] Subscriber Login',
			'[Feature] Subscriptions',
		],
		slack_id: 'C083ZPVVDTK',
		board_id: 'https://github.com/orgs/Automattic/projects/443/views/13',
	},
	Photon: {
		team: 'Heart of Gold',
		labels: [ '[Feature] Photon', '[Boost Feature] Image CDN', '[Package] Image CDN' ],
		slack_id: 'C016BBAFHHS',
		board_id: 'https://github.com/orgs/Automattic/projects/548',
	},
	Protect: {
		team: 'Scan',
		labels: [ '[Plugin] Protect', '[Feature] Protect', '[Package] WAF' ],
		slack_id: 'C029WFNV69M',
		board_id: 'https://github.com/orgs/Automattic/projects/767',
	},
	'React Dashboard': {
		team: 'Vulcan',
		labels: [ 'Admin Page' ],
		slack_id: 'C05PV073SG3',
		board_id: 'https://github.com/orgs/Automattic/projects/778',
	},
	Search: {
		team: 'Red',
		labels: [ '[Plugin] Search', '[Package] Search', 'Instant Search', '[Feature] Search' ],
		slack_id: 'C02ME06LF',
		board_id: 'https://github.com/orgs/Automattic/projects/408',
	},
	'Social tools': {
		team: 'Reach',
		labels: [
			'[Plugin] Social',
			'[Extension] Publicize',
			'[JS Package] Publicize Components',
			'[Package] Publicize',
			'[Feature] Publicize',
		],
		slack_id: 'C02JJ910CNL',
		board_id: 'https://github.com/orgs/Automattic/projects/742',
	},
	Stats: {
		team: 'Red',
		labels: [
			'[Feature] Stats Data',
			'[Package] Stats Data',
			'Stats',
			'Odyssey Stats',
			'Odyssey Stats Widget',
			'[Stats] Subscribers',
		],
		slack_id: 'C0438NHCLSY',
		board_id: 'https://github.com/orgs/Automattic/projects/1028',
	},
	'Super Cache': {
		team: 'Heart of Gold',
		labels: [ '[Plugin] Super Cache' ],
		slack_id: 'C016BBAFHHS',
		board_id: 'https://github.com/orgs/Automattic/projects/548',
	},
	Verbum: {
		team: 'Vertex',
		labels: [ '[mu wpcom Feature] Verbum Comments' ],
		slack_id: 'C02T4NVL4JJ',
		board_id: 'https://github.com/orgs/Automattic/projects/908/views/1',
	},
	VideoPress: {
		team: 'Nexus',
		labels: [ '[Package] VideoPress', '[Feature] VideoPress', '[Plugin] VideoPress' ],
		slack_id: 'C02LT75D3',
		board_id: 'https://github.com/orgs/Automattic/projects/460',
	},
	// Let this be the last item. It will act as a catch-all for any issues that haven't been matched until now.
	'Jetpack plugin': {
		team: 'Jetpack',
		labels: [ '[Plugin] Jetpack' ],
		slack_id: 'CDLH4C1UZ',
	},
};
