import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { Step, Option } from './types';

export const useMetaDescriptionStep = (): Step => {
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< Option[] >( [] );
	const { messages, setMessages, addMessage, removeLastMessage } = useMessages();
	const { editPost } = useDispatch( 'core/editor' );
	const [ completed, setCompleted ] = useState( false );

	useEffect( () => {
		setMessages( [
			{
				content: __( "Now, let's optimize your meta description.", 'jetpack' ),
				showIcon: true,
			},
		] );
	}, [ setMessages ] );

	const handleMetaDescriptionSelect = useCallback( ( option: Option ) => {
		setSelectedMetaDescription( option.content );
		setMetaDescriptionOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

	const handleMetaDescriptionSubmit = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		await editPost( { meta: { advanced_seo_description: selectedMetaDescription } } );
		removeLastMessage();
		addMessage( { content: selectedMetaDescription, isUser: true } );
		addMessage( { content: __( 'Meta description updated! ✅', 'jetpack' ) } );
		setCompleted( true );
	}, [ selectedMetaDescription, addMessage, editPost, removeLastMessage ] );

	const handleMetaDescriptionGenerate = useCallback( async () => {
		let newMetaDescriptions;
		// we only generate if options are empty
		if ( metaDescriptionOptions.length === 0 ) {
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
		addMessage( { content: __( "Here's a suggestion:", 'jetpack' ) } );
		setMetaDescriptionOptions( newMetaDescriptions || metaDescriptionOptions );
	}, [ metaDescriptionOptions, addMessage, removeLastMessage ] );

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		setMetaDescriptionOptions( [] );
		addMessage( { content: <TypingMessage /> } );
		const newMetaDescription = await new Promise< Array< Option > >( resolve =>
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
		addMessage( { content: __( "Here's a new suggestion:", 'jetpack' ) } );
		setMetaDescriptionOptions( newMetaDescription );
	}, [ addMessage, removeLastMessage ] );

	const handleSkip = useCallback( () => {
		addMessage( { content: __( 'Skipped!', 'jetpack' ) } );
	}, [ addMessage ] );

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
		onSkip: handleSkip,
		value: selectedMetaDescription,
		setValue: setSelectedMetaDescription,
		completed,
		setCompleted,
	};
};
