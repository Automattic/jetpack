/**
 * Report-page tab APIs remain exported from this module so report routes import
 * the root and panel through one package specifier. Base UI's tabs context does
 * not cross bundle copies of `@wordpress/ui`, so the root and panel wrappers
 * must come from the same module instance.
 */
export {
	SectionTabPanel as ReportPageTabPanel,
	SectionTabs as ReportPageTabs,
	type SectionTab as ReportPageTab,
	type SectionTabPanelProps as ReportPageTabPanelProps,
	type SectionTabsProps as ReportPageTabsProps,
} from '@jetpack-premium-analytics/ui';
