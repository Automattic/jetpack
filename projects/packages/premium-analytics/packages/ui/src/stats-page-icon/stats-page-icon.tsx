/**
 * External dependencies
 */
import { jetpack } from '@jetpack-premium-analytics/icons';
import { Icon } from '@wordpress/ui';

/**
 * The product mark for a page header's `visual` slot.
 *
 * The slot is decorative (`aria-hidden`), so the mark carries no label of its
 * own — the breadcrumb trail already names the page.
 *
 * @return The Jetpack mark.
 */
export function StatsPageIcon() {
	return <Icon icon={ jetpack } size={ 24 } />;
}
