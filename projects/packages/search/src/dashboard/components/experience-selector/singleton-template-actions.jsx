import restApi from '@automattic/jetpack-api';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ConfirmDialog is the canonical WP confirm pattern; still under the experimental flag in @wordpress/components 33.
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
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
 * the editor URL / reset REST path / isCustomized state, one "Edit …"
 * link, one "Restore default" link that opens a destructive confirm
 * dialog, and an AJAX DELETE that posts a notice on success / failure.
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
							// running the AJAX delete directly. The dialog's
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
					if ( ! config.postType ) {
						return;
					}
					setIsResetting( true );
					try {
						// `restApi` (not `apiFetch`) so the call resolves
						// against the wpcom-origin-prefixed root the dashboard
						// configures in `wrapped-dashboard.jsx` — that's what
						// makes the DELETE reachable on WordPress.com Simple
						// sites, where the local /wp-json/ surface doesn't
						// expose Jetpack-registered routes.
						await restApi.resetSearchTemplate( config.postType );
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
