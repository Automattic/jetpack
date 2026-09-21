/**
 * External dependencies
 */
import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import { Page } from '@wordpress/admin-ui';
import type { ComponentProps, ReactNode } from 'react';

type PageProps = ComponentProps< typeof Page >;

type FormsPageProps = PageProps & {
	children: ReactNode;
	showFooter?: boolean;
};

/**
 * Thin chrome wrapper for the wp-build Forms dashboard routes.
 *
 * @deprecated Render `Page` from `@wordpress/admin-ui` directly instead. The wrapper
 * added a `.jp-admin-page` root and a `jp-admin-page__page` class so Jetpack's shared
 * `jetpack-admin-page-layout-wp-build` mixin could lay the page out, which duplicates
 * what `Page` and wp-build's own stage already do. The Forms routes no longer use it.
 *
 * @param      props            - All `<Page>` props are forwarded through.
 * @param      props.children   - Page content (rendered inside `<Page>`, above the footer).
 * @param      props.showFooter - Whether to render the trailing `<JetpackFooter>`.
 * @return The Forms page chrome.
 */
export default function FormsPage( {
	children,
	showFooter = true,
	...pageProps
}: FormsPageProps ): JSX.Element {
	return (
		<div className="jp-admin-page">
			<Page className="jp-admin-page__page" { ...pageProps }>
				{ children }
				{ showFooter && <JetpackFooter /> }
			</Page>
		</div>
	);
}
