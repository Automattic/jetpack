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
 * Mirrors the structure of `<AdminPage>` from `@automattic/jetpack-components`
 * (`.jp-admin-page` root + `@wordpress/admin-ui` `<Page className="jp-admin-page__page">`
 * + a trailing `<JetpackFooter>`), so the shared `jetpack-admin-page-layout-wp-build`
 * mixin can pin the header, scroll the middle, and pin the footer. We use this
 * local wrapper instead of `<AdminPage>` directly because the Forms routes pass
 * `<Page>` props that `<AdminPage>` does not forward (`badges`, `ariaLabel`,
 * `hasPadding`) and rely on `<Page>` rendering their DataViews children directly
 * rather than inside `<AdminPage>`'s `<Container><Col>` wrap.
 *
 * @param props            - All `<Page>` props are forwarded through.
 * @param props.children   - Page content (rendered inside `<Page>`, above the footer).
 * @param props.showFooter - Whether to render the trailing `<JetpackFooter>`. Defaults to
 *                         `true`; pass `false` on full-height routes (e.g. the DataViews
 *                         Responses inbox) where the footer competes with the view's own
 *                         pagination/scroll chrome. Mirrors `<AdminPage>`'s `showFooter`.
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
