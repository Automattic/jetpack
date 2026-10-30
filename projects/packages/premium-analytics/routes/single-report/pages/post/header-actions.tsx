/**
 * External dependencies
 */
import { ButtonLink } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
/**
 * Internal dependencies
 */
import { getPostTypeCopy } from './post-header-slots';
import type { PostSummary } from './use-post-summary';
import type { ReactNode } from 'react';

/**
 * The View post action: the live post in a new tab, once its public URL is known.
 *
 * @param summary - The post summary.
 * @return The action, or nothing without a URL.
 */
export function postHeaderActions( summary: PostSummary ): ReactNode {
	const publicUrl = safeHttpUrl( summary.url );

	return publicUrl ? (
		<ButtonLink variant="solid" tone="neutral" size="compact" href={ publicUrl } openInNewTab>
			{ getPostTypeCopy( summary.type ).view }
		</ButtonLink>
	) : null;
}
