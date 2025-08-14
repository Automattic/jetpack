// Logo imports - using correct file extensions
import BackupLogo from './logos/backup-logo';
import BoostLogo from './logos/boost-logo';
import crmLogoImage from './logos/crm-logo.png';
import ProtectLogo from './logos/protect-logo';
import SearchLogo from './logos/search-logo';
import SocialLogo from './logos/social-logo';
import VideoPressLogo from './logos/videopress-logo';

// Create a component wrapper for the CRM PNG logo
const CRMLogo = ( { height = 32 } ) => (
	<img src={ crmLogoImage } alt="CRM Logo" height={ height } />
);

// Product configuration for pricing tables
export const PRODUCT_CONFIGS = {
	backup: {
		title: 'Protect your site with reliable backups',
		bundle: 'security',
		logo: BackupLogo,
		features: [
			{ name: 'Real-time backups' },
			{ name: 'One-click restores' },
			{ name: 'Malware scanning' },
			{ name: 'Priority support' },
			{ name: 'Activity log monitoring' },
			{ name: 'Complete site security' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Basic backup features' ] },
			main: { name: 'Backup', cta: 'Get Backup' },
			bundle: { name: 'Security Bundle', cta: 'Get Security Bundle' },
		},
	},
	social: {
		title: 'Grow your audience with powerful social tools',
		bundle: 'growth',
		logo: SocialLogo,
		features: [
			{ name: 'Auto-posting to social media' },
			{ name: 'Social media previews' },
			{ name: 'Advanced scheduling' },
			{ name: 'Engagement analytics' },
			{ name: 'Multiple account management' },
			{ name: 'Complete growth suite' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Basic social sharing' ] },
			main: { name: 'Social', cta: 'Get Social' },
			bundle: { name: 'Growth Bundle', cta: 'Get Growth Bundle' },
		},
	},
	boost: {
		title: 'Speed up your site with powerful optimization',
		bundle: 'complete',
		logo: BoostLogo,
		features: [
			{ name: 'Critical CSS generation' },
			{ name: 'Image optimization' },
			{ name: 'Performance monitoring' },
			{ name: 'Priority support' },
			{ name: 'Advanced caching' },
			{ name: 'Complete site optimization' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Basic optimization' ] },
			main: { name: 'Boost', cta: 'Get Boost' },
			bundle: { name: 'Complete Bundle', cta: 'Get Complete Bundle' },
		},
	},
	crm: {
		title: 'Manage your customer relationships effectively',
		bundle: null, // CRM doesn't have a bundle
		logo: CRMLogo,
		features: [
			{ name: 'Contact management' },
			{ name: 'Lead tracking' },
			{ name: 'Email campaigns' },
			{ name: 'Sales pipeline' },
			{ name: 'Reporting & analytics' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Basic CRM features' ] },
			main: { name: 'CRM Pro', cta: 'Get CRM Pro' },
		},
	},
	protect: {
		title: 'Secure your site from threats and attacks',
		bundle: 'security',
		logo: ProtectLogo,
		features: [
			{ name: 'Malware scanning' },
			{ name: 'Firewall protection' },
			{ name: 'Login security' },
			{ name: 'Threat monitoring' },
			{ name: 'Security reporting' },
			{ name: 'Complete security suite' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Basic protection' ] },
			main: { name: 'Protect', cta: 'Get Protect' },
			bundle: { name: 'Security Bundle', cta: 'Get Security Bundle' },
		},
	},
	stats: {
		title: 'Understand your audience with detailed analytics',
		bundle: 'growth',
		features: [
			{ name: 'Visitor analytics' },
			{ name: 'Traffic insights' },
			{ name: 'Performance metrics' },
			{ name: 'Detailed reporting' },
			{ name: 'Advanced filters' },
			{ name: 'Complete growth tools' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Basic stats' ] },
			main: { name: 'Stats Pro', cta: 'Get Stats' },
			bundle: { name: 'Growth Bundle', cta: 'Get Growth Bundle' },
		},
	},
	videopress: {
		title: 'Host and stream videos with ease',
		bundle: 'complete',
		logo: VideoPressLogo,
		features: [
			{ name: 'HD video hosting' },
			{ name: 'Customizable player' },
			{ name: 'Analytics dashboard' },
			{ name: 'Privacy controls' },
			{ name: 'Ad-free experience' },
			{ name: 'Complete site tools' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Basic video hosting' ] },
			main: { name: 'VideoPress', cta: 'Get VideoPress' },
			bundle: { name: 'Complete Bundle', cta: 'Get Complete Bundle' },
		},
	},
	search: {
		title: 'Help visitors find content with powerful search',
		bundle: null, // Search doesn't have a bundle
		logo: SearchLogo,
		features: [
			{ name: 'Instant search results' },
			{ name: 'Search filtering' },
			{ name: 'Customizable design' },
			{ name: 'Advanced search analytics' },
			{ name: 'Multi-language support' },
			{ name: 'Search API access' },
		],
		tiers: {
			free: { name: 'Free', features: [ 'Up to 5,000 records' ] },
			main: { name: 'Search', cta: 'Get Search' },
		},
	},
};
