/**
 * External dependencies
 */
import { Icon, Link, Tooltip } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './view-live-link.module.scss';
import type { JSX } from 'react';

export type ViewLiveLinkProps = {
	/**
	 * The URL to open: what `toViewLiveUrl()` returned, or a URL already passed
	 * through `safeHttpUrl()`. This component does not check the scheme.
	 */
	href: string;
	/** The row's title or site name, which names the link for assistive technology. */
	label: string;
	className?: string;
};

/**
 * The "View" action of a row whose label stays in the dashboard: an icon-only
 * link that opens the live post, page, video, email or referring site in a new
 * tab, as every row in classic Stats offered. It carries the same boxed icon
 * classic used, not the new-tab marker a linked-out title shows.
 *
 * @return The link.
 */
export function ViewLiveLink( { href, label, className }: ViewLiveLinkProps ): JSX.Element {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Link
						className={ clsx( styles.link, className ) }
						href={ href }
						variant="unstyled"
						openInNewTab
						aria-label={ sprintf(
							/* translators: %s: the title of a post, page, video or email, or the name of a referring site such as "Facebook". */
							__( 'View "%s" in a new tab', 'jetpack-premium-analytics-pkg' ),
							label
						) }
					>
						<Icon icon={ external } size={ 16 } />
					</Link>
				}
			/>
			<Tooltip.Popup>{ __( 'View in new tab', 'jetpack-premium-analytics-pkg' ) }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
