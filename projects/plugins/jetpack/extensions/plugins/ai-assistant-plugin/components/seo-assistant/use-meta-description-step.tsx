import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useEffect, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { Step, Option } from './types';

export const useMetaDescriptionStep = (): Step => {
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< Option[] >( [] );
	const { messages, setMessages, addMessage, removeLastMessage, editLastMessage } = useMessages();
	const { editPost } = useDispatch( 'core/editor' );
	const [ completed, setCompleted ] = useState( false );

	useEffect( () => {
		if ( messages.length === 0 ) {
			setMessages( [
				{
					content: __( "Now, let's optimize your meta description.", 'jetpack' ),
					showIcon: true,
				},
			] );
		}
	}, [ setMessages, messages ] );

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
		const editedFirstMessage = createInterpolateElement(
			__( "Now, let's optimize your meta description.<br />Here's a suggestion:", 'jetpack' ),
			{ br: <br /> }
		);
		// addMessage( { content: __( "Here's a suggestion:", 'jetpack' ) } );
		editLastMessage( editedFirstMessage );
		setMetaDescriptionOptions( newMetaDescriptions || metaDescriptionOptions );
	}, [ metaDescriptionOptions, addMessage, removeLastMessage, editLastMessage ] );

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		setMetaDescriptionOptions( [] );
		editLastMessage( __( "Now, let's optimize your meta description.", 'jetpack' ) );
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
		// addMessage( { content: __( "Here's a new suggestion:", 'jetpack' ) } );
		const editedFirstMessage = createInterpolateElement(
			__( "Now, let's optimize your meta description.<br />Here's a new suggestion:", 'jetpack' ),
			{ br: <br /> }
		);
		editLastMessage( editedFirstMessage );
		setMetaDescriptionOptions( newMetaDescription );
	}, [ addMessage, removeLastMessage, editLastMessage ] );

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
