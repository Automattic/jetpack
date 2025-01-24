import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { Step, Option } from './types';

export const useTitleStep = (): Step => {
	const [ selectedTitle, setSelectedTitle ] = useState< string >();
	const [ titleOptions, setTitleOptions ] = useState< Option[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const { messages, setMessages, addMessage, removeLastMessage } = useMessages();
	const [ completed, setCompleted ] = useState( false );

	const handleTitleSelect = useCallback( ( option: Option ) => {
		setSelectedTitle( option.content );
		setTitleOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

	useEffect( () => {
		setMessages( [
			{
				content: __( "Let's optimise your title.", 'jetpack' ),
				showIcon: true,
			},
		] );
	}, [ setMessages ] );

	const handleTitleGenerate = useCallback( async () => {
		let newTitles;
		// we only generate if options are empty
		if ( titleOptions.length === 0 ) {
			addMessage( { content: <TypingMessage /> } );
			newTitles = await new Promise( resolve =>
				setTimeout(
					() =>
						resolve( [
							{
								id: '1',
								content: 'A Photo Gallery for Gardening Enthusiasths: Flora Guide',
							},
							{
								id: '2',
								content:
									'Flora Guide: Beautiful Photos of Flowers and Plants for Gardening Enthusiasts',
							},
						] ),
					2000
				)
			);
			removeLastMessage();
		}
		addMessage( {
			content: __(
				'Here are two suggestions based on your keywords. Select the one you prefer:',
				'jetpack'
			),
		} );
		setTitleOptions( newTitles || titleOptions );
	}, [ titleOptions, addMessage, removeLastMessage ] );

	const handleTitleRegenerate = useCallback( async () => {
		// This would typically be an async call to generate new titles
		// replaceOptionsWithFauxUseMessages();
		setTitleOptions( [] );
		addMessage( { content: <TypingMessage /> } );
		const newTitles = await new Promise< Array< Option > >( resolve =>
			setTimeout(
				() =>
					resolve( [
						{
							id: '1',
							content: 'A Photo Gallery for Gardening Enthusiasths: Flora Guide',
						},
						{
							id: '2',
							content:
								'Flora Guide: Beautiful Photos of Flowers and Plants for Gardening Enthusiasts',
						},
					] ),
				2000
			)
		);
		removeLastMessage();
		addMessage( {
			content: __(
				'Here are two new suggestions based on your keywords. Select the one you prefer:',
				'jetpack'
			),
		} );
		setTitleOptions( newTitles );
	}, [ addMessage, removeLastMessage ] );

	const handleTitleSubmit = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		await editPost( { title: selectedTitle, meta: { jetpack_seo_html_title: selectedTitle } } );
		removeLastMessage();
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		setCompleted( true );
	}, [ selectedTitle, addMessage, editPost, removeLastMessage ] );

	const handleSkip = useCallback( () => {
		addMessage( { content: __( 'Skipped!', 'jetpack' ) } );
	}, [ addMessage ] );

	return {
		id: 'title',
		title: __( 'Optimise Title', 'jetpack' ),
		messages,
		type: 'options',
		options: titleOptions,
		onSelect: handleTitleSelect,
		onSubmit: handleTitleSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: handleTitleRegenerate,
		retryCtaLabel: __( 'Regenerate', 'jetpack' ),
		onStart: handleTitleGenerate,
		onSkip: handleSkip,
		value: selectedTitle,
		setValue: setSelectedTitle,
		completed,
		setCompleted,
	};
};
