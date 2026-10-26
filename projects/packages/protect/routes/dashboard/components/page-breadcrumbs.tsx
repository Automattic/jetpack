import { getMyJetpackUrl, getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { useLinkProps } from '@wordpress/route';
import { Breadcrumb, VisuallyHidden } from '@wordpress/ui';

/**
 * Whether the trail can start at My Jetpack; without it the dashboard keeps a plain title.
 *
 * @return True when My Jetpack's page is reachable.
 */
export const hasJetpackCrumb = (): boolean => getScriptData()?.myJetpack?.isAvailable === true;

/**
 * The page header's "Jetpack / Protect" trail, ending in the current view, and the page's heading.
 * The trail needs an ancestor, so render it only when hasJetpackCrumb() or `current` is set.
 *
 * @param props         - Component props.
 * @param props.current - The view below the dashboard, such as the threat report.
 * @return The trail.
 */
export default function PageBreadcrumbs( { current }: { current?: string } ) {
	const { href, onClick } = useLinkProps( { to: '/' } );
	// "Jetpack" and "Protect" are product names and are not translated.
	const title = current ?? 'Protect';

	return (
		<>
			<VisuallyHidden render={ <h1 /> }>{ title }</VisuallyHidden>
			<Breadcrumb.Root
				// Breadcrumb doesn't update while its "…" button has focus; remounting on the title does.
				key={ title }
				className="jp-protect-breadcrumbs"
				aria-label={ __( 'Breadcrumbs', 'jetpack-protect-pkg' ) }
			>
				{ hasJetpackCrumb() && (
					<Breadcrumb.LinkItem className="jp-protect-breadcrumbs__item" href={ getMyJetpackUrl() }>
						Jetpack
					</Breadcrumb.LinkItem>
				) }
				{ current && (
					<Breadcrumb.LinkItem
						className="jp-protect-breadcrumbs__item"
						href={ href }
						onClick={ onClick }
					>
						Protect
					</Breadcrumb.LinkItem>
				) }
				<Breadcrumb.CurrentItem className="jp-protect-breadcrumbs__item">
					{ title }
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		</>
	);
}
