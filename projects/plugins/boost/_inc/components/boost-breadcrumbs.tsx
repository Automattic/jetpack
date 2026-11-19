import { __ } from '@wordpress/i18n';
import { Breadcrumb, VisuallyHidden } from '@wordpress/ui';
import type { MouseEventHandler } from 'react';
import './boost-breadcrumbs.scss';

type Props = {
	title: string;
	boostLink: { href: string; onClick: MouseEventHandler< HTMLAnchorElement > };
};

export default function BoostBreadcrumbs( { title, boostLink }: Props ) {
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
				<Breadcrumb.LinkItem className="jetpack-boost-breadcrumbs__item" { ...boostLink }>
					{ 'Boost' /** "Boost" is a product name, do not translate. */ }
				</Breadcrumb.LinkItem>
				<Breadcrumb.CurrentItem className="jetpack-boost-breadcrumbs__item">
					{ title }
				</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		</>
	);
}
