import { __ } from '@wordpress/i18n';
import { useLinkProps } from '@wordpress/route';
import { Breadcrumb, VisuallyHidden } from '@wordpress/ui';

/**
 * The page header's "Protect" trail, ending in the current view below it, and the page's heading.
 *
 * @param props         - Component props.
 * @param props.current - The view below the dashboard, such as the threat report.
 * @return The trail.
 */
export default function PageBreadcrumbs( { current }: { current: string } ) {
	const { href, onClick } = useLinkProps( { to: '.', search: {} } as never );

	return (
		<>
			<VisuallyHidden render={ <h1 /> }>{ current }</VisuallyHidden>
			<Breadcrumb.Root
				// Breadcrumb doesn't update while its "…" button has focus; remounting on the title does.
				key={ current }
				className="jp-protect-breadcrumbs"
				aria-label={ __( 'Breadcrumbs', 'jetpack-protect-pkg' ) }
			>
				<Breadcrumb.LinkItem
					className="jp-protect-breadcrumbs__item"
					href={ href }
					onClick={ onClick }
				>
					{ /* "Protect" is a product name and is not translated. */ }
					Protect
				</Breadcrumb.LinkItem>
				<Breadcrumb.CurrentItem className="jp-protect-breadcrumbs__item">
					{ current }
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		</>
	);
}
