/**
 * External dependencies
 */
import { ButtonLink } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { EntityRecordSummary } from './use-entity-summary';
import type { ReactNode } from 'react';

/**
 * The View action: the live entity in a new tab, once its public URL is known.
 *
 * @param summary - The entity summary.
 * @param label   - The action's label, when the page names the kind, such as "View post".
 * @return The action, or nothing without a URL.
 */
export function entityHeaderActions( summary: EntityRecordSummary, label?: string ): ReactNode {
	const publicUrl = safeHttpUrl( summary.url );

	return publicUrl ? (
		<ButtonLink variant="solid" tone="neutral" size="compact" href={ publicUrl } openInNewTab>
			{ label ?? __( 'View', 'jetpack-premium-analytics-pkg' ) }
		</ButtonLink>
	) : null;
}
