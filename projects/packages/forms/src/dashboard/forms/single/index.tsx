/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
/**
 * External dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { Link, useNavigate, useParams } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import Inbox from '../../inbox/index.js';

type RouteParams = {
	formId?: string;
};

/**
 * Route element for a single form's responses.
 *
 * Renders the existing Inbox UI, but pre-filters and locks it to a given form ID.
 *
 * @return JSX element.
 */
export default function SingleFormResponses(): JSX.Element | null {
	const { formId } = useParams() as RouteParams;
	const navigate = useNavigate();
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );

	const parentId = useMemo( () => {
		const id = Number( formId );
		return Number.isFinite( id ) && id > 0 ? id : null;
	}, [ formId ] );

	const formRecord = useSelect(
		select =>
			parentId
				? select( coreDataStore ).getEntityRecord( 'postType', 'jetpack_form', parentId )
				: undefined,
		[ parentId ]
	) as { title?: { rendered?: string } } | undefined;

	const formTitle = useMemo( () => {
		const rendered = formRecord?.title?.rendered || '';
		const decoded = decodeEntities( rendered );
		return decoded;
	}, [ formRecord?.title?.rendered ] );

	useEffect( () => {
		// Invalid ID: go back to the appropriate dashboard screen without a full page reload.
		if ( parentId === null ) {
			navigate( isCentralFormManagementEnabled === true ? '/forms' : '/responses', {
				replace: true,
			} );
		}
	}, [ parentId, isCentralFormManagementEnabled, navigate ] );

	// Short-term: show a stable title/subtitle while the (optional) jetpack_form title is loading,
	// and for non-jetpack_form "source" IDs (pre-CFM) where we may not be able to resolve a title yet.
	const baseTitle = __( 'Forms', 'jetpack-forms' );
	const formsPath = useMemo(
		() => ( isCentralFormManagementEnabled === true ? '/forms' : '/responses' ),
		[ isCentralFormManagementEnabled ]
	);
	const pageTitle = useMemo( () => {
		const formsLink = (
			<Link className="jp-forms-page-header-title__link" to={ formsPath }>
				{ baseTitle }
			</Link>
		);
		return formTitle ? (
			<>
				{ formsLink } / { formTitle }
			</>
		) : (
			formsLink
		);
	}, [ baseTitle, formTitle, formsPath ] );
	const pageSubtitle = formTitle
		? sprintf(
				/* translators: %s: form name */
				__( 'Viewing responses for %s.', 'jetpack-forms' ),
				formTitle
		  )
		: __( 'View responses for this form.', 'jetpack-forms' );

	if ( parentId === null ) {
		return null;
	}

	return <Inbox parentId={ parentId } pageTitle={ pageTitle } pageSubtitle={ pageSubtitle } />;
}
