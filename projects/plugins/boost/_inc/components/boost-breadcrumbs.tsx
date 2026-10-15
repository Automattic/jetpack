import { __ } from '@wordpress/i18n';
import { Breadcrumb, VisuallyHidden } from '@wordpress/ui';
import { isMyJetpackAvailable } from '../overview/lib/use-modules-state';
import type { MouseEventHandler } from 'react';
import './boost-breadcrumbs.scss';

type Props = {
	subpage?: {
		title: string;
		boostLink: { href: string; onClick: MouseEventHandler< HTMLAnchorElement > };
	};
};

export default function BoostBreadcrumbs( { subpage }: Props ) {
	const title = subpage?.title ?? 'Boost'; /** "Boost" is a product name, do not translate. */

	return (
		<>
			<VisuallyHidden render={ <h1 /> }>{ title }</VisuallyHidden>
			<Breadcrumb.Root
				// Breadcrumb doesn't update while its "…" button has focus, so after a page change
				// it could still show the previous page. Remounting on the title avoids that.
				key={ title }
				className="jetpack-boost-breadcrumbs"
				aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) }
			>
				{ isMyJetpackAvailable() && (
					<Breadcrumb.LinkItem
						className="jetpack-boost-breadcrumbs__item"
						href="admin.php?page=my-jetpack"
					>
						{ 'Jetpack' /** "Jetpack" is a product name, do not translate. */ }
					</Breadcrumb.LinkItem>
				) }
				{ subpage && (
					<Breadcrumb.LinkItem className="jetpack-boost-breadcrumbs__item" { ...subpage.boostLink }>
						{ 'Boost' /** "Boost" is a product name, do not translate. */ }
					</Breadcrumb.LinkItem>
				) }
				<Breadcrumb.CurrentItem className="jetpack-boost-breadcrumbs__item">
					{ title }
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		</>
	);
}
