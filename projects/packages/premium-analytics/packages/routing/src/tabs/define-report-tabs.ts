/**
 * A single report-tab definition with a lazy label getter.
 *
 * The label is a getter (resolved at call time) rather than a plain string so
 * translations are applied after the i18n locale data has loaded. This helper is
 * deliberately i18n-free: callers pass `getLabel` closures that call `__()`
 * themselves, keeping the routing package free of a UI/i18n dependency so
 * `route.ts` guards can call `resolve()` without pulling those in.
 */
export type ReportTabDefinition< TabId extends string > = {
	id: TabId;
	getLabel: () => string;

	/**
	 * Heading for the section this tab opens, where it reads differently from
	 * the tab itself: `Posts & Pages` names the tab, `Posts & Pages report`
	 * heads the records under it.
	 */
	getTitle?: () => string;
};

export type ReportTab< TabId extends string > = {
	id: TabId;
	label: string;
};

/**
 * The machinery returned by `defineReportTabs` for one page's tab set.
 */
export type ReportTabs< TabId extends string > = {
	/**
	 * Ordered list of tab IDs — the single source of truth for which tabs exist
	 * and in what order.
	 */
	ids: readonly TabId[];

	/**
	 * Narrow an arbitrary string (e.g. from the URL) to a known tab ID, falling
	 * back to the default when it is missing or unknown.
	 */
	resolve: ( value: string | undefined ) => TabId;

	getTabs: () => ReportTab< TabId >[];

	getTabLabel: ( id: TabId ) => string;

	/** The heading for a tab's section, falling back to the tab's own label. */
	getTabTitle: ( id: TabId ) => string;
};

/**
 * Capture a report page's tab machinery from an ordered list of definitions.
 *
 * @param definitions - Ordered tab definitions with lazy label getters.
 * @param defaultId   - The tab shown when the URL has no (or an unknown) tab value.
 * @return The tab machinery for the page.
 */
export function defineReportTabs< TabId extends string >(
	definitions: ReadonlyArray< ReportTabDefinition< TabId > >,
	defaultId: TabId
): ReportTabs< TabId > {
	const ids = definitions.map( def => def.id );
	const idSet = new Set< string >( ids );

	const resolve = ( value: string | undefined ): TabId =>
		value && idSet.has( value ) ? ( value as TabId ) : defaultId;

	const getTabs = (): ReportTab< TabId >[] =>
		definitions.map( ( { id, getLabel } ) => ( { id, label: getLabel() } ) );

	const getTabLabel = ( id: TabId ): string =>
		definitions.find( def => def.id === id )?.getLabel() ?? id;

	const getTabTitle = ( id: TabId ): string => {
		const definition = definitions.find( def => def.id === id );

		return definition?.getTitle?.() ?? definition?.getLabel() ?? id;
	};

	return { ids, resolve, getTabs, getTabLabel, getTabTitle };
}
