/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { config } from '../index';

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
	const createForm = useCallback( async ( formPattern: string ) => {
		const data = new FormData();

		data.append( 'action', 'create_new_form' );
		data.append( 'newFormNonce', config( 'newFormNonce' ) );

		if ( formPattern ) {
			data.append( 'pattern', formPattern );
		}

		const response = await fetch( window.ajaxurl, { method: 'POST', body: data } );

		const {
			success,
			post_url: postUrl,
			data: message,
		}: { success?: boolean; data?: string; post_url?: string } = await response.json();

		if ( success === false ) {
			throw new Error( message );
		}

		return postUrl;
	}, [] );

	const openNewForm = useCallback(
		async ( { formPattern, showPatterns, analyticsEvent }: ClickHandlerProps ) => {
			try {
				const postUrl = await createForm( formPattern );

				if ( postUrl ) {
					analyticsEvent?.( { formPattern } );

					window.open(
						`${ postUrl }${ showPatterns && ! formPattern ? '&showJetpackFormsPatterns' : '' }`
					);
				}
			} catch ( error ) {
				console.error( error.message ); // eslint-disable-line no-console
			}
		},
		[ createForm ]
	);

	return { createForm, openNewForm };
}
