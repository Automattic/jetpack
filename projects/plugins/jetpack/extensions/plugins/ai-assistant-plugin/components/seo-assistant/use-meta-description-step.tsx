import { useDispatch } from '@wordpress/data';
import { useCallback, useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { Step, OptionMessage } from './types';

export const useMetaDescriptionStep = (): Step => {
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< OptionMessage[] >( [] );
	const {
		messages,
		setMessages,
		addMessage,
		removeLastMessage,
		editLastMessage,
		setSelectedMessage,
	} = useMessages();
	const { editPost } = useDispatch( 'core/editor' );
	const [ completed, setCompleted ] = useState( false );

	const handleMetaDescriptionSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedMetaDescription( option.content as string );
			setSelectedMessage( option );
		},
		[ setSelectedMessage ]
	);

	const handleMetaDescriptionSubmit = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		await editPost( { meta: { advanced_seo_description: selectedMetaDescription } } );
		removeLastMessage();
		addMessage( { content: __( 'Meta description updated! ✅', 'jetpack' ) } );
		setCompleted( true );
		return selectedMetaDescription;
	}, [ selectedMetaDescription, addMessage, editPost, removeLastMessage ] );

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
				addMessage( { content: <TypingMessage /> } );
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
						2000
					)
				);
				removeLastMessage();
			}
			setMetaDescriptionOptions( newMetaDescriptions );
			const editedFirstMessage = fromSkip
				? createInterpolateElement(
						__(
							"Skipped!<br />Now, let's optimize your meta description.<br />Here's a new suggestion:",
							'jetpack'
						),
						{ br: <br /> }
				  )
				: createInterpolateElement(
						__(
							"Now, let's optimize your meta description.<br />Here's a new suggestion:",
							'jetpack'
						),
						{ br: <br /> }
				  );
			editLastMessage( editedFirstMessage );
			newMetaDescriptions.forEach( meta =>
				addMessage( { ...meta, type: 'option', isUser: true } )
			);
		},
		[ metaDescriptionOptions, addMessage, removeLastMessage, setMessages, editLastMessage ]
	);

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		setMetaDescriptionOptions( [] );
		setMessages( [
			{ content: __( "Now, let's optimize your meta description.", 'jetpack' ), showIcon: true },
		] );
		addMessage( { content: <TypingMessage /> } );
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
				2000
			)
		);
		removeLastMessage();
		const editedFirstMessage = createInterpolateElement(
			__( "Now, let's optimize your meta description.<br />Here's a new suggestion:", 'jetpack' ),
			{ br: <br /> }
		);
		editLastMessage( editedFirstMessage );
		setMetaDescriptionOptions( newMetaDescription );
		newMetaDescription.forEach( meta => addMessage( { ...meta, type: 'option', isUser: true } ) );
	}, [ addMessage, removeLastMessage, editLastMessage, setMessages ] );

	return {
		id: 'meta',
		title: __( 'Add meta description', 'jetpack' ),
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
		completed,
		setCompleted,
	};
};
