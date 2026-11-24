/**
 * Read / Write MCP tools pages — group tools by display group: Content
 * Authoring, Site, Account, etc. A group's members usually come from one STRAP
 * facade, but multiple facades can resolve to the same group (e.g. Create Site
 * into Site), and standalone abilities can declare a group directly in config.
 * Each settings-visible ability carries a `group` field (a clean slug, e.g.
 * `site`) matching the `name` of one of the ordered group descriptors returned
 * by the API (`mcp_abilities.groups`, see utils.js `getGroupDescriptors()`).
 */

import { __ } from '@wordpress/i18n';
import { SUB_CATEGORY_ORDER, getSubCategory } from './categories';
import { requiresOptIn } from './group-intents';

// Name of the client-side section that holds every opt-in tool. Not an API group.
export const OPT_IN_GROUP_NAME = 'requires-opt-in';

const FLAT_SUB_CATEGORY_ORDER = [ ...new Set( Object.values( SUB_CATEGORY_ORDER ).flat() ) ];

/**
 * Group tools by the API-provided display group, ordered by descriptor order.
 * Tools with no group (or an unrecognised group slug) fall into a trailing "Other" bucket.
 * Opt-in tools go to their own section, last, whatever group the API gives them.
 * Callers show that section without an "Enable all" switch.
 *
 * @param {Array<[string, object]>}                                                  tools            - Tool entries to group, each as [toolId, ability].
 * @param {Array<{name: string, label: string, description: string, order: number}>} groupDescriptors - Ordered group descriptors from the API.
 * @return {Array<{group: object|null, label: string, tools: Array<[string, object]>}>} Groups in descriptor order, with optional trailing "Other" and opt-in buckets.
 */
export function groupToolsByGroup( tools, groupDescriptors ) {
	const byGroupName = new Map();
	const unmatched = [];
	const optIn = [];

	for ( const entry of tools ) {
		const [ , ability ] = entry;
		if ( requiresOptIn( ability ) ) {
			optIn.push( entry );
			continue;
		}
		const groupName = ability?.group ?? null;
		if ( groupName === null ) {
			unmatched.push( entry );
			continue;
		}
		if ( ! byGroupName.has( groupName ) ) {
			byGroupName.set( groupName, [] );
		}
		byGroupName.get( groupName ).push( entry );
	}

	const groups = [];
	for ( const descriptor of groupDescriptors ) {
		const groupTools = byGroupName.get( descriptor.name );
		if ( groupTools && groupTools.length > 0 ) {
			groups.push( { group: descriptor, label: descriptor.label, tools: groupTools } );
		}
		byGroupName.delete( descriptor.name );
	}

	// Abilities whose `group` doesn't match any known descriptor (unexpected,
	// but don't silently drop them) join the unmatched/no-group fallback bucket.
	for ( const groupTools of byGroupName.values() ) {
		unmatched.push( ...groupTools );
	}

	if ( unmatched.length > 0 ) {
		groups.push( {
			group: null,
			label: __( 'Other', 'jetpack' ),
			tools: unmatched,
		} );
	}

	if ( optIn.length > 0 ) {
		const label = __( 'Requires individual approval', 'jetpack' );
		groups.push( {
			group: {
				name: OPT_IN_GROUP_NAME,
				label,
				description: __( 'Turn these on one at a time. “Enable all” skips them.', 'jetpack' ),
				order: Number.MAX_SAFE_INTEGER,
			},
			label,
			tools: optIn,
		} );
	}

	return groups;
}

/**
 * Sub-group a set of tools by their API `category` field, ordered by
 * FLAT_SUB_CATEGORY_ORDER. Tools with no sub-category land in a trailing
 * bucket with `subCategory: null`. Returns a single-element array when all
 * tools share the same sub-category (or none).
 *
 * @param {Array<[string, object]>} tools - Tool entries to sub-group, each as [toolId, ability].
 * @return {Array<{subCategory: string|null, tools: Array<[string, object]>}>} Sub-groups in display order; null subCategory bucket is always last.
 */
export function groupToolsBySubCategory( tools ) {
	const bySubCategory = new Map();

	for ( const entry of tools ) {
		const [ toolId, ability ] = entry;
		const sub = getSubCategory( toolId, ability ) ?? null;
		if ( ! bySubCategory.has( sub ) ) {
			bySubCategory.set( sub, [] );
		}
		bySubCategory.get( sub ).push( entry );
	}

	const result = [];

	for ( const sub of FLAT_SUB_CATEGORY_ORDER ) {
		if ( bySubCategory.has( sub ) ) {
			result.push( { subCategory: sub, tools: bySubCategory.get( sub ) } );
			bySubCategory.delete( sub );
		}
	}

	// Any sub-categories not in the known order (future-proofing)
	for ( const [ sub, subTools ] of bySubCategory ) {
		if ( sub !== null ) {
			result.push( { subCategory: sub, tools: subTools } );
		}
	}

	// Tools with no resolved sub-category at the end
	if ( bySubCategory.has( null ) ) {
		result.push( { subCategory: null, tools: bySubCategory.get( null ) } );
	}

	return result;
}
