/**
 * The Skills tab's catalog: the skill index the page's PHP fetches from the
 * public skills site and passes in `jetpackAiSettings.skills`. Each skill's
 * instructions load on their own when its panel opens (use-skill-body.js).
 */

import { __, sprintf } from '@wordpress/i18n';

/** How many categories get their own filter pill; the rest sit in the More menu. */
export const PINNED_CATEGORY_COUNT = 3;

/** The catalog's category that cuts across the others; a skill's own category is any other. */
export const GOOD_FIRST = 'good-first-skills';

/** Category slugs in display order. The rest follow, biggest first. */
export const CATEGORY_ORDER = [
	GOOD_FIRST,
	'setup-launch',
	'writing',
	'seo-ai-search',
	'accessibility',
	'site-health',
];

/** Skills that lead a category, ahead of catalog order, by category slug. */
export const LEADING_SKILL_SLUGS = {
	[ GOOD_FIRST ]: [
		'site-seo-audit',
		'check-your-sites-accessibility',
		'check-your-sites-security-and-health',
	],
	writing: [ 'humanizer' ],
};

// The catalog's prompts name this placeholder site.
const PLACEHOLDER_SITE = 'example.com';

const CONNECTOR_NAME = 'WordPress.com connector';

/**
 * The index the page was given.
 *
 * @return {{categories: object[], skills: object[]}} The index, empty when it failed to load.
 */
function getIndex() {
	const index = window?.jetpackAiSettings?.skills;
	const skills = Array.isArray( index?.skills ) ? index.skills : [];
	if ( ! normalized.has( skills ) ) {
		normalized.set( skills, skills.map( withOwnCategory ) );
	}
	return {
		categories: Array.isArray( index?.categories ) ? index.categories : [],
		skills: normalized.get( skills ),
	};
}

// Each index's skills, normalized once, so a skill keeps its identity between calls.
const normalized = new WeakMap();

/**
 * A skill with `category`, its own category, beside all of them in `categories`.
 *
 * @param {object} skill - A skill as the index has it.
 * @return {object} The skill.
 */
function withOwnCategory( skill ) {
	const categories = Array.isArray( skill.categories ) ? skill.categories : [];
	return {
		...skill,
		categories,
		category: categories.find( slug => slug !== GOOD_FIRST ) ?? categories[ 0 ] ?? '',
	};
}

/**
 * Every skill, in catalog order.
 *
 * @return {object[]} The skills.
 */
export function getCatalog() {
	return getIndex().skills;
}

/**
 * The catalog's categories, in catalog order.
 *
 * @return {{slug: string, name: string}[]} The categories.
 */
export function getCategories() {
	return getIndex().categories;
}

/**
 * The categories that have skills: the set order first, then the rest by size.
 *
 * @param {object} counts - Skill count per category key.
 * @return {string[]} Category keys.
 */
export function getOrderedCategoryKeys( counts ) {
	const rank = key => {
		const index = CATEGORY_ORDER.indexOf( key );
		return index === -1 ? CATEGORY_ORDER.length : index;
	};
	return getCategories()
		.map( category => category.slug )
		.filter( key => counts[ key ] )
		.sort( ( a, b ) => rank( a ) - rank( b ) || counts[ b ] - counts[ a ] );
}

/**
 * Whether a skill is in a category, its own or another it's also filed under.
 *
 * @param {object} skill - The skill.
 * @param {string} key   - The category key.
 * @return {boolean} Whether it is.
 */
export function isInCategory( skill, key ) {
	return skill.categories.includes( key );
}

/**
 * A category's display name.
 *
 * @param {string} slug - The category's slug.
 * @return {string} Its name, or '' when the catalog doesn't have it.
 */
export function getCategoryName( slug ) {
	return getCategories().find( category => category.slug === slug )?.name ?? '';
}

/**
 * Find a skill in the catalog.
 *
 * @param {string} slug - The skill's slug.
 * @return {object|undefined} The skill.
 */
export function getSkill( slug ) {
	return getCatalog().find( skill => skill.slug === slug );
}

/**
 * The prompt Send to agent hands over: the skill's own starter prompt, aimed
 * at this site. A bare request gets a lead naming the connector and the skill.
 *
 * @param {object} skill    - The skill.
 * @param {string} siteName - The site's address, e.g. "example.com".
 * @return {string} The prompt.
 */
export function buildPrompt( skill, siteName ) {
	const prompt = ( skill.tryPrompt ?? '' ).trim().split( PLACEHOLDER_SITE ).join( siteName );
	if ( ! prompt.includes( CONNECTOR_NAME ) ) {
		return sprintf(
			/* translators: %1$s: skill name, e.g. "Site SEO and AIO audit". %2$s: site address. %3$s: the skill's starter request, e.g. "Who has access to my site?" */
			__( 'Use the WordPress.com connector to run the %1$s skill on %2$s. %3$s', 'jetpack' ),
			skill.title,
			siteName,
			prompt
		).trim();
	}
	return prompt.includes( siteName )
		? prompt
		: sprintf(
				/* translators: %1$s: the skill's starter request, e.g. "Use the WordPress.com connector to check my contact page". %2$s: site address. */
				__( '%1$s on %2$s', 'jetpack' ),
				prompt.replace( /[.!?]$/, '' ),
				siteName
			);
}
