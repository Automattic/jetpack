/**
 * Build a read/write-aware per-group `group_intents` key: the backend's
 * SettingsHelper::ability_covered_by_group_intents() only covers an ability
 * via a compound key shaped "{read|write}:{group}" (e.g. "write:site").
 * This scopes a group's "Enable all" to the category (Read or Write) it was
 * toggled from, instead of defaulting every op in the group regardless of category.
 *
 * @param {'read'|'write'} category  - Read or write scope.
 * @param {string}         groupName - Group slug (e.g. "site").
 * @return {string} Compound intent key (e.g. "write:site").
 */
export function groupIntentKey( category, groupName ) {
	return `${ category }:${ groupName }`;
}

/**
 * A group/read/write intent only sets the *default* for abilities with no
 * explicit per-op override — an explicit override from an earlier individual
 * toggle always wins. So an "Enable all" action must also force-write an
 * explicit override for any tool in scope whose current state disagrees with
 * the new value, or a previously-toggled tool would silently stay stuck.
 *
 * @param {Array<[string, object]>} scopedTools - Tools to evaluate, each as [toolId, ability].
 * @param {boolean}                 enabled     - Target enabled state.
 * @return {Record<string, boolean>|undefined} Overrides for disagreeing tools, or undefined if none.
 */
export function getOverridesToMatch( scopedTools, enabled ) {
	const overrides = {};
	scopedTools.forEach( ( [ toolId, tool ] ) => {
		if ( tool.enabled !== enabled ) {
			overrides[ toolId ] = enabled;
		}
	} );
	return Object.keys( overrides ).length > 0 ? overrides : undefined;
}
