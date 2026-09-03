/**
 * External dependencies
 */
import { SectionTabPanel } from '@jetpack-premium-analytics/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './detail-page-layout.module.scss';
import type { SectionTabPanelProps } from '@jetpack-premium-analytics/ui';

/**
 * The tab root ships beside the panel so a detail route imports both through one
 * package specifier. Base UI's tabs context does not cross bundle copies of
 * `@wordpress/ui`, so the two must come from the same module instance.
 */
export {
	SectionTabs as DetailPageTabs,
	type SectionTab as DetailPageTab,
	type SectionTabsProps as DetailPageTabsProps,
} from '@jetpack-premium-analytics/ui';

export type DetailPageTabPanelProps< TabId extends string = string > =
	SectionTabPanelProps< TabId >;

/**
 * A `DetailPageSection` that is also one tab's panel, for a tabbed detail page.
 *
 * @param {DetailPageTabPanelProps} props - The component props.
 * @return The section, as a tab panel.
 */
export function DetailPageTabPanel< TabId extends string = string >( {
	value,
	children,
	className,
}: DetailPageTabPanelProps< TabId > ) {
	return (
		<SectionTabPanel value={ value } className={ clsx( styles.section, className ) }>
			{ children }
		</SectionTabPanel>
	);
}
