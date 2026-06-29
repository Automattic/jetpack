/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
import * as React from 'react';
/**
 * Types
 */
import type { FormResponse } from '../../src/types/index.ts';

/**
 * Breadcrumb trail for the standalone single response page.
 *
 * Mirrors the admin-ui `<Breadcrumbs>` look (15px crumbs, "/" separators, the
 * current item rendered as the page `<h1>`), but is hand-rolled so the form
 * crumb can carry a `search` param — `@wordpress/admin-ui`'s `<Breadcrumbs>`
 * only forwards `to` (a path) to its router link, and a query string in `to`
 * isn't parsed by the router.
 *
 * The form crumb is shown only when the response is tied to an actual
 * `jetpack_form` post (`form_id`), and links to that form's filtered responses
 * list (`/responses/inbox?sourceId=<form_id>`).
 *
 * Also used by the loading and "not found" states (where there is no
 * `response`): the "Forms" crumb still links back to the inbox so the user can
 * reorient, with `currentLabel` as the trailing crumb.
 *
 * @param props              - Component props.
 * @param props.response     - The response being viewed, if loaded.
 * @param props.formTitle    - The (decoded) title of the form/source.
 * @param props.currentLabel - Override for the trailing crumb (defaults to `#<id>`).
 * @return The breadcrumb trail.
 */
export default function SingleResponseBreadcrumbs( {
	response,
	formTitle = '',
	currentLabel,
}: {
	response?: FormResponse | null;
	formTitle?: string;
	currentLabel?: string;
} ): React.JSX.Element {
	const showFormCrumb = Boolean( response?.form_id ) && Boolean( formTitle );
	const current = currentLabel ?? ( response ? `#${ response.id }` : '' );

	return (
		<nav
			aria-label={ __( 'Breadcrumbs', 'jetpack-forms' ) }
			className="jp-forms__single-response-breadcrumbs"
		>
			<Link to="/responses/inbox" className="jp-forms__single-response-breadcrumbs__link">
				{ __( 'Forms', 'jetpack-forms' ) }
			</Link>
			{ showFormCrumb && (
				<>
					<span className="jp-forms__single-response-breadcrumbs__sep" aria-hidden="true">
						/
					</span>
					<Link
						to="/responses/inbox"
						// Router types aren't registered in this build, so `search` resolves to
						// `never`; cast through `unknown` to pass the filter param at runtime.
						search={ { sourceId: String( response?.form_id ) } as unknown as never }
						className="jp-forms__single-response-breadcrumbs__link"
					>
						{ formTitle }
					</Link>
				</>
			) }
			{ current && (
				<>
					<span className="jp-forms__single-response-breadcrumbs__sep" aria-hidden="true">
						/
					</span>
					<h1 className="jp-forms__single-response-breadcrumbs__current">{ current }</h1>
				</>
			) }
		</nav>
	);
}
