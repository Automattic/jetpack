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
import { useParams } from 'react-router';
/**
 * Internal dependencies
 */
import { PARTIAL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';
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

	const lockedParentId = useMemo( () => {
		const id = Number( formId );
		return Number.isFinite( id ) && id > 0 ? id : null;
	}, [ formId ] );

	const formRecord = useSelect(
		select =>
			lockedParentId
				? select( coreDataStore ).getEntityRecord( 'postType', 'jetpack_form', lockedParentId )
				: undefined,
		[ lockedParentId ]
	) as { title?: { rendered?: string } } | undefined;

	const formTitle = useMemo( () => {
		const rendered = formRecord?.title?.rendered || '';
		const decoded = decodeEntities( rendered );
		return decoded;
	}, [ formRecord?.title?.rendered ] );

	useEffect( () => {
		// Invalid ID: go back to the Forms dashboard root (no hash).
		if ( lockedParentId === null ) {
			window.location.href = PARTIAL_RESPONSES_PATH;
		}
	}, [ lockedParentId ] );

	if ( lockedParentId === null ) {
		return null;
	}

	// Short-term: show a stable title/subtitle while the (optional) jetpack_form title is loading,
	// and for non-jetpack_form "source" IDs (pre-CFM) where we may not be able to resolve a title yet.
	const baseTitle = __( 'Form', 'jetpack-forms' );
	const pageTitle = formTitle ? `${ baseTitle } > ${ formTitle }` : baseTitle;
	const pageSubtitle = formTitle
		? sprintf(
				/* translators: %s: form name */
				__( 'Viewing responses for %s.', 'jetpack-forms' ),
				formTitle
		  )
		: __( 'View responses for this form.', 'jetpack-forms' );

	return (
		<Inbox
			lockedParentId={ lockedParentId }
			pageTitle={ pageTitle }
			pageSubtitle={ pageSubtitle }
		/>
	);
}
