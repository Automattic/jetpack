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
		const { post_url: postUrl }: { post_url: string } = await response.json();

		return postUrl;
	}, [] );

	const openNewForm = useCallback(
		async ( { formPattern, showPatterns, analyticsEvent }: ClickHandlerProps ) => {
			const postUrl = await createForm( formPattern );

			if ( postUrl ) {
				analyticsEvent?.( { formPattern } );

				window.open(
					`${ postUrl }${ showPatterns && ! formPattern ? '&showJetpackFormsPatterns' : '' }`
				);
			}
		},
		[ createForm ]
	);

	return { createForm, openNewForm };
}
