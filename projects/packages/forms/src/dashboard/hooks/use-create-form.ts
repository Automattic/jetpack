/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value.ts';
import { getNewFormEditorUrl } from '../utils.ts';

/**
 * Navigate the page to a form URL.
 *
 * Returns a promise that never settles. The page is on its way out, so there is no "done" to report:
 * resolving would tell callers the work finished and let them tear down the progress they are showing
 * while the browser is still loading the editor.
 *
 * @param url - The form URL to navigate to.
 * @return A promise that never settles.
 */
const openFormLink = ( url: string ): Promise< never > => {
	/*
	 * We are using a temporary link click to navigate. Using window.open() does not work reliably due
	 * to Safari's popup blocker, especially after async work.
	 */
	const link = document.createElement( 'a' );
	link.setAttribute( 'href', url );
	link.style.display = 'none';

	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );

	return new Promise< never >( () => {} );
};

type ClickHandlerProps = {
	formPattern?: string;
	formTitle?: string;
	showPatterns?: boolean;
	analyticsEvent?: ( { formPattern }: { formPattern: string } ) => void;
};

type CreateFormReturn = {
	createForm: ( pattern: string, formTitle?: string ) => Promise< string | undefined >;

	/**
	 * Create a form and open it in the editor.
	 *
	 * Rejects if the form could not be created. Otherwise it never settles: success means the browser
	 * is navigating away, so there is no "done" to report and nothing after an `await` of this will
	 * run. Callers can rely on that to hold a busy state until the next page takes over.
	 */
	openNewForm: ( props: ClickHandlerProps ) => Promise< never >;
};

/**
 * Hook to create a new form.
 *
 * @return {CreateFormReturn} The createForm and openNewForm functions.
 */
export default function useCreateForm(): CreateFormReturn {
	const newFormNonce = useConfigValue( 'newFormNonce' );
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );
	const adminUrl = useConfigValue( 'adminUrl' );
	const ajaxUrl = useConfigValue( 'ajaxUrl' );
	const createForm = useCallback(
		async ( formPattern: string, formTitle?: string ) => {
			const data = new FormData();

			data.append( 'action', 'create_new_form' );
			data.append( 'newFormNonce', newFormNonce );

			if ( formPattern ) {
				data.append( 'pattern', formPattern );
			}

			/*
			 * The naming modal is shared by every create entry point, so a title can arrive here even
			 * though this path is only taken while the config that selects it is still loading. Send it
			 * rather than dropping it, so the post is not created untitled behind the user's back.
			 */
			const trimmedFormTitle = formTitle?.trim();
			if ( trimmedFormTitle ) {
				data.append( 'formTitle', trimmedFormTitle );
			}

			// Fall back to window.ajaxurl for backwards compatibility.
			const fetchUrl = ajaxUrl || window.ajaxurl;
			const response = await fetch( fetchUrl, { method: 'POST', body: data } );

			const {
				success,
				post_url: postUrl,
				data: message,
			}: { success?: boolean; data?: string; post_url?: string } = await response.json();

			if ( success === false ) {
				throw new Error( message );
			}

			return postUrl;
		},
		[ newFormNonce, ajaxUrl ]
	);

	const openNewForm = useCallback(
		async ( { formPattern, formTitle, showPatterns, analyticsEvent }: ClickHandlerProps ) => {
			try {
				// When centralized form management is enabled, create a jetpack_form post via wp-admin.
				// Keep existing behavior when disabled (or not yet loaded).
				if ( isCentralFormManagementEnabled === true ) {
					analyticsEvent?.( { formPattern: formPattern ?? '' } );
					// Use config adminUrl to build full URL for external admin contexts.
					return await openFormLink( getNewFormEditorUrl( formTitle, adminUrl ) );
				}

				const postUrl = await createForm( formPattern, formTitle );

				if ( ! postUrl ) {
					// Resolving here would look like success to callers that are waiting to hand off to a
					// page load, leaving them stuck showing progress for a navigation that never starts.
					throw new Error( 'Creating the form did not return an editor URL.' );
				}

				analyticsEvent?.( { formPattern } );

				const url = `${ postUrl }${
					showPatterns && ! formPattern ? '&showJetpackFormsPatterns' : ''
				}`;
				return await openFormLink( url );
			} catch ( error ) {
				// Log the error itself, not just its message: this is the only diagnostic the failing
				// entry points leave behind, and the stack is what makes it actionable.
				console.error( error ); // eslint-disable-line no-console
				// Re-throw so callers can tell a started navigation from a failed creation, and keep
				// their own UI (a busy button, an open modal) in the right state.
				throw error;
			}
		},
		[ createForm, isCentralFormManagementEnabled, adminUrl ]
	);

	return { createForm, openNewForm };
}
