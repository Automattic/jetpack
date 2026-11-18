/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getViewStatus } from './pinned-view.ts';
/**
 * Types
 */
import type { PinnedViewQuery } from './pinned-view.ts';
import type { FormResponse } from '../../src/types/index.ts';
import type { Page } from '@wordpress/admin-ui';
import type { ComponentProps } from 'react';

type BreadcrumbItems = NonNullable< ComponentProps< typeof Page >[ 'breadcrumbs' ] >;

/**
 * Breadcrumb trail for the standalone single response page.
 *
 * "Forms" follows the pinned view, so a response opened from Spam or Trash leads back there.
 * The form crumb, shown only for a response tied to a `jetpack_form` post, opens that form's
 * filtered responses list.
 *
 * @param args              - Arguments.
 * @param args.response     - The response being viewed, if loaded.
 * @param args.formTitle    - The (decoded) title of the form/source.
 * @param args.currentLabel - Override for the trailing crumb (defaults to `#<id>`).
 * @param args.pinned       - The list query the response was opened from.
 * @return The breadcrumb items.
 */
export default function getSingleResponseBreadcrumbs( {
	response,
	formTitle = '',
	currentLabel,
	pinned,
}: {
	response?: FormResponse | null;
	formTitle?: string;
	currentLabel?: string;
	pinned: PinnedViewQuery;
} ): BreadcrumbItems {
	const current = currentLabel ?? ( response ? `#${ response.id }` : '' );
	const listPath = `/responses/${ getViewStatus( pinned ) }`;

	return [
		{ label: __( 'Forms', 'jetpack-forms' ), href: listPath },
		...( response?.form_id && formTitle
			? [ { label: formTitle, href: `${ listPath }?sourceId=${ response.form_id }` } ]
			: [] ),
		...( current ? [ { label: current } ] : [] ),
	];
}
