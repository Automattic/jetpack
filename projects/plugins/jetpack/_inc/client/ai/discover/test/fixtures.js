/**
 * A small skill index in the shape the page's PHP passes in `jetpackAiSettings.skills`,
 * with enough categories to fill the pills and the More menu.
 */

const CATALOG = 'https://agentskills.wordpress.com/';

const skill = ( slug, title, category, description, tryPrompt, also = [] ) => ( {
	slug,
	title,
	description,
	prerequisites: 'Editor or administrator role on the site.',
	tryPrompt,
	categories: [ ...also, category ],
	url: CATALOG + slug + '/',
} );

export const SKILLS_INDEX = {
	categories: [
		{ slug: 'seo', name: 'SEO' },
		{ slug: 'general', name: 'General' },
		{ slug: 'content', name: 'Content' },
		{ slug: 'marketing', name: 'Marketing' },
		{ slug: 'security', name: 'Security' },
		{ slug: 'performance', name: 'Performance' },
		{ slug: 'good-first-skills', name: 'Good first skills' },
	],
	skills: [
		skill(
			'performance-audit',
			'Performance audit',
			'performance',
			'Find what makes the site slow and fix the biggest problems first.',
			'Use the WordPress.com connector to run a performance audit on example.com'
		),
		skill(
			'site-seo-audit',
			'SEO audit',
			'seo',
			'Audit titles, metas, and headings sitewide and fix what falls short.',
			'Use the WordPress.com connector to run the SEO audit on example.com',
			[ 'good-first-skills' ]
		),
		skill(
			'write-meta-descriptions',
			'Write meta descriptions',
			'seo',
			'Write a meta description for every post that lacks one.',
			'Use the WordPress.com connector to write missing meta descriptions on example.com'
		),
		skill(
			'check-your-sites-security-and-health',
			'Security checkup',
			'security',
			'Check logins, plugins and backups for weak spots.',
			'Use the WordPress.com connector to run a security checkup on example.com',
			[ 'good-first-skills' ]
		),
		skill(
			'build-a-contact-form',
			'Build a contact form',
			'content',
			'Add a contact form that sends replies to your inbox.',
			'Use the WordPress.com connector to add a contact form on example.com'
		),
		skill(
			'review-who-has-access-to-your-site',
			'Review who has access',
			'general',
			'List everyone who can sign in and suggest lower roles.',
			'Who has access to my site?'
		),
		skill(
			'set-up-a-newsletter',
			'Set up a newsletter',
			'marketing',
			'Start a newsletter and send the first email.',
			'Use the WordPress.com connector to set up a newsletter on example.com'
		),
	],
};

export const SEO_PROMPT = 'Use the WordPress.com connector to run the SEO audit on example.com';
