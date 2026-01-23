/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value.ts';

const openFormLinkInNewTab = ( url: string ) => {
	/*
	 * We are using a temporary link click to open the page. Using window.open() does not work reliably
	 * due to Safari's popup blocker, especially after async work.
	 */
	const link = document.createElement( 'a' );
	link.setAttribute( 'href', url );
	link.setAttribute( 'target', '_blank' );
	link.setAttribute( 'rel', 'noopener noreferrer' );
	link.style.display = 'none';

	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
};

type ClickHandlerProps = {
	formPattern?: string;
	showPatterns?: boolean;
	analyticsEvent?: ( { formPattern }: { formPattern: string } ) => void;
};

type CreateFormReturn = {
	createForm: ( pattern: string ) => Promise< string >;
	openNewForm: ( props: ClickHandlerProps ) => Promise< void >;
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
		async ( formPattern: string ) => {
			const data = new FormData();

			data.append( 'action', 'create_new_form' );
			data.append( 'newFormNonce', newFormNonce );

			if ( formPattern ) {
				data.append( 'pattern', formPattern );
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
		async ( { formPattern, showPatterns, analyticsEvent }: ClickHandlerProps ) => {
			try {
				// When centralized form management is enabled, create a jetpack_form post via wp-admin.
				// Keep existing behavior when disabled (or not yet loaded).
				if ( isCentralFormManagementEnabled === true ) {
					analyticsEvent?.( { formPattern: formPattern ?? '' } );
					// Use config adminUrl to build full URL for external admin contexts.
					const url = `${ adminUrl || '' }post-new.php?post_type=jetpack_form`;
					openFormLinkInNewTab( url );
					return;
				}

				const postUrl = await createForm( formPattern );

				if ( postUrl ) {
					analyticsEvent?.( { formPattern } );

					const url = `${ postUrl }${
						showPatterns && ! formPattern ? '&showJetpackFormsPatterns' : ''
					}`;
					openFormLinkInNewTab( url );
				}
			} catch ( error ) {
				console.error( error.message ); // eslint-disable-line no-console
			}
		},
		[ createForm, isCentralFormManagementEnabled, adminUrl ]
	);

	return { createForm, openNewForm };
}
