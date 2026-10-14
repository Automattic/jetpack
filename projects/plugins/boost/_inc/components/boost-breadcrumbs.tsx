import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Breadcrumb } from '@wordpress/ui';
import type { MouseEventHandler } from 'react';
import './boost-breadcrumbs.scss';

type Props = {
	subpage?: {
		title: string;
		boostLink: { href: string; onClick: MouseEventHandler< HTMLAnchorElement > };
	};
};

export default function BoostBreadcrumbs( { subpage }: Props ) {
	const title = subpage?.title ?? 'Boost';

	return (
		<>
			<VisuallyHidden as="h1">{ title }</VisuallyHidden>
			<Breadcrumb.Root
				className="jetpack-boost-breadcrumbs"
				aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) }
			>
				<Breadcrumb.LinkItem
					className="jetpack-boost-breadcrumbs__item"
					href="admin.php?page=my-jetpack"
				>
					Jetpack
				</Breadcrumb.LinkItem>
				{ subpage && (
					<Breadcrumb.LinkItem className="jetpack-boost-breadcrumbs__item" { ...subpage.boostLink }>
						Boost
					</Breadcrumb.LinkItem>
				) }
				<Breadcrumb.CurrentItem className="jetpack-boost-breadcrumbs__item">
					{ title }
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		</>
	);
}
