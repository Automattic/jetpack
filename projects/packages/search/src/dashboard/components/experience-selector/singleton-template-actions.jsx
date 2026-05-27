// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ConfirmDialog is the canonical WP confirm pattern; still under the experimental flag in @wordpress/components 33.
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { STORE_ID } from 'store';
import CardLink from './card-link';

/**
 * Edit + Restore-default link pair for a `Singleton_Template_Cpt`-backed
 * editor flow on the PHP side. The two consumers — the experimental
 * blocks-powered Overlay (SEARCH-216) and the classic-theme Search
 * template route — share an identical shape: one config blob describing
 * the editor URL / postType / isCustomized state, one "Edit …" link,
 * one "Restore default" link that opens a destructive confirm dialog,
 * and an AJAX DELETE that posts a notice on success / failure.
 *
 * Local state (`justReset`, `isResetting`, `isResetConfirmOpen`) is
 * scoped here so two of these components can coexist on a single page
 * (e.g. Embedded card + Overlay card both customized) without their
 * reset flags cross-contaminating.
 *
 * @param {object}  props                       - Props.
 * @param {object}  props.config                - The `{enabled, editorUrl, postType, isCustomized}` blob from the matching singleton-template selector.
 * @param {string}  props.editLabel             - Visible label for the "Edit …" link.
 * @param {string}  props.restoreConfirmMessage - Body copy for the destructive confirm dialog.
 * @param {string}  props.successMessage        - Notice copy posted after a successful reset.
 * @param {string}  props.errorMessage          - Notice copy posted when the AJAX reset fails (used as a fallback when the server doesn't supply an error message).
 * @param {boolean} props.linksDisabled         - Mirrors the card's "is this experience inactive" state — disables both links the same way the inactive card's commit-overlay button does.
 * @return {import('react').Element} - The link pair + reset confirm dialog.
 */
export default function SingletonTemplateActions( {
	config,
	editLabel,
	restoreConfirmMessage,
	successMessage,
	errorMessage,
	linksDisabled,
} ) {
	// Local override after a successful reset: the server-side
	// `isCustomized` stays true in the initial-state blob the page was
	// rendered with, so we hide the "Restore default" link client-side
	// once the AJAX DELETE returns. Cleared if the admin opens the
	// editor again (which would lazy-create a fresh singleton).
	const [ justReset, setJustReset ] = useState( false );
	const [ isResetting, setIsResetting ] = useState( false );
	const [ isResetConfirmOpen, setResetConfirmOpen ] = useState( false );
	const { successNotice, errorNotice } = useDispatch( STORE_ID );
	// Read the wpcom-origin-prefixed API root + nonce from the dashboard
	// store directly (same selectors `wrapped-dashboard.jsx` hands to
	// `restApi.setWpcomOriginApiUrl()` / `setApiNonce()` at boot). Building
	// the URL here — rather than delegating to a helper in the shared
	// `@automattic/jetpack-api` package — keeps this fix contained inside
	// the Search package, so the wpcom-origin DELETE doesn't pull a
	// monorepo-wide rebuild of every consumer of jetpack-api.
	const { wpcomOriginApiUrl, apiNonce } = useSelect(
		select => ( {
			wpcomOriginApiUrl: select( STORE_ID ).getWpcomOriginApiUrl(),
			apiNonce: select( STORE_ID ).getAPINonce(),
		} ),
		[]
	);

	const restoreLabel = __( 'Restore default', 'jetpack-search-pkg' );

	return (
		<>
			<Stack
				direction="row"
				gap="sm"
				align="start"
				className="jp-search-experience-option__actions"
			>
				{ /*
				   The edit link always renders so the affordance stays
				   visible as a muted CTA on inactive cards too — matches the
				   FSE "Edit search template" / "Insert pattern" pattern on
				   the Embedded card. Disabled when (a) the card isn't the
				   active experience yet (the surrounding card's inactive
				   state) or (b) the PHP side withheld `config.editorUrl` for
				   non-admins — `CardLink` renders an inert `<span>` in that
				   state, so a non-admin who somehow lands on this page
				   doesn't get a live `<a href="#">` that navigates nowhere.
				*/ }
				<CardLink
					label={ editLabel }
					href={ config.editorUrl || '#' }
					disabled={ linksDisabled || ! config.editorUrl }
					// Re-show "Restore default" on the admin's return from
					// the editor: the click implies a fresh singleton is
					// about to be (re-)created on the server, so the
					// previously-set `justReset` flag no longer reflects
					// reality.
					onClick={ () => setJustReset( false ) }
				/>
				{ config.postType && config.isCustomized && ! justReset && (
					<CardLink
						label={ restoreLabel }
						href="#"
						disabled={ linksDisabled || isResetting }
						onClick={ event => {
							// Destructive — open the confirm dialog instead of
							// running the DELETE directly. The dialog's
							// confirm handler is the one that fires the request.
							event.preventDefault();
							setResetConfirmOpen( true );
						} }
					/>
				) }
			</Stack>
			<ConfirmDialog
				isOpen={ isResetConfirmOpen }
				onConfirm={ async () => {
					setResetConfirmOpen( false );
					// Defensive guard: the dialog can only open via the
					// `isCustomized && postType` CardLink above, so `postType`
					// is non-null in practice — avoid firing a DELETE against
					// `undefined` if the gating logic ever shifts.
					if ( ! config.postType || ! wpcomOriginApiUrl ) {
						return;
					}
					setIsResetting( true );
					try {
						// Build the URL against `wpcomOriginApiUrl` (not
						// apiFetch's default /wp-json/ root) so the request
						// reaches the Jetpack route on WordPress.com Simple
						// sites, where Jetpack-registered routes are only
						// exposed under wp-json/wpcom-origin/. The nonce
						// header matches what the rest of the Search dashboard
						// sends via restApi for the same reason.
						const url = `${ wpcomOriginApiUrl }jetpack/v4/search/templates/${ encodeURIComponent(
							config.postType
						) }`;
						const response = await fetch( url, {
							method: 'DELETE',
							credentials: 'same-origin',
							headers: { 'X-WP-Nonce': apiNonce ?? '' },
						} );
						if ( ! response.ok ) {
							const data = await response.json().catch( () => null );
							throw new Error( data?.message || errorMessage );
						}
						setJustReset( true );
						successNotice( successMessage );
					} catch ( error ) {
						errorNotice( error?.message || errorMessage );
					} finally {
						setIsResetting( false );
					}
				} }
				onCancel={ () => setResetConfirmOpen( false ) }
				confirmButtonText={ restoreLabel }
			>
				{ restoreConfirmMessage }
			</ConfirmDialog>
		</>
	);
}
