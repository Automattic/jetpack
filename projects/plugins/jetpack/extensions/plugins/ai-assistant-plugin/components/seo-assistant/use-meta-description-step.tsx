import { useDispatch } from '@wordpress/data';
import { useCallback, useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMessages } from './wizard-messages';
import type { Step, OptionMessage } from './types';

export const useMetaDescriptionStep = (): Step => {
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< OptionMessage[] >( [] );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
	const { editPost } = useDispatch( 'core/editor' );

	const handleMetaDescriptionSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedMetaDescription( option.content as string );
			setSelectedMessage( option );
		},
		[ setSelectedMessage ]
	);

	const handleMetaDescriptionSubmit = useCallback( async () => {
		await editPost( { meta: { advanced_seo_description: selectedMetaDescription } } );
		addMessage( { content: __( 'Meta description updated! ✅', 'jetpack' ) } );
		return selectedMetaDescription;
	}, [ selectedMetaDescription, addMessage, editPost ] );

	const handleMetaDescriptionGenerate = useCallback(
		async ( { fromSkip } ) => {
			const initialMessage = fromSkip
				? {
						content: createInterpolateElement(
							__( "Skipped!<br />Now, let's optimize your meta description.", 'jetpack' ),
							{ br: <br /> }
						),
						showIcon: true,
				  }
				: {
						content: __( "Now, let's optimize your meta description.", 'jetpack' ),
						showIcon: true,
				  };
			let newMetaDescriptions = [ ...metaDescriptionOptions ];
			// we only generate if options are empty
			setMessages( [ initialMessage ] );
			if ( newMetaDescriptions.length === 0 ) {
				newMetaDescriptions = await new Promise( resolve =>
					setTimeout(
						() =>
							resolve( [
								{
									id: 'meta-1',
									content:
										'Explore breathtaking flower and plant photography in our Flora Guide, featuring tips and inspiration for gardening and plant enthusiasts to enhance their outdoor spaces.',
								},
							] ),
						1500
					)
				);
			}
			setMetaDescriptionOptions( newMetaDescriptions );
			const editedFirstMessage = fromSkip
				? createInterpolateElement(
						__(
							"Skipped!<br />Now, let's optimize your meta description.<br />Here's a suggestion:",
							'jetpack'
						),
						{ br: <br /> }
				  )
				: createInterpolateElement(
						__( "Now, let's optimize your meta description.<br />Here's a suggestion:", 'jetpack' ),
						{ br: <br /> }
				  );
			editLastMessage( editedFirstMessage );
			newMetaDescriptions.forEach( meta =>
				addMessage( { ...meta, type: 'option', isUser: true } )
			);
		},
		[ metaDescriptionOptions, addMessage, setMessages, editLastMessage ]
	);

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		const newMetaDescription = await new Promise< Array< OptionMessage > >( resolve =>
			setTimeout(
				() =>
					resolve( [
						{
							id: 'meta-1' + Math.random(),
							content:
								'Explore breathtaking flower and plant photography in our Flora Guide, featuring tips and inspiration for gardening and plant enthusiasts to enhance their outdoor spaces.',
						},
					] ),
				1500
			)
		);

		setMetaDescriptionOptions( prev => [ ...prev, ...newMetaDescription ] );
		newMetaDescription.forEach( meta => addMessage( { ...meta, type: 'option', isUser: true } ) );
	}, [ addMessage ] );

	return {
		id: 'meta',
		title: __( 'Add meta description', 'jetpack' ),
		label: __( 'Meta description', 'jetpack' ),
		messages: messages,
		type: 'options',
		options: metaDescriptionOptions,
		onSelect: handleMetaDescriptionSelect,
		onSubmit: handleMetaDescriptionSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: handleMetaDescriptionRegenerate,
		retryCtaLabel: __( 'Regenerate', 'jetpack' ),
		onStart: handleMetaDescriptionGenerate,
		value: selectedMetaDescription,
		setValue: setSelectedMetaDescription,
		includeInResults: true,
	};
};
