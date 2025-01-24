import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import type { Step, Option } from './types';

export const useTitleStep = ( {
	addMessage,
	removeLastMessage,
	onStep,
	contextData,
	setIsBusy,
} ): Step => {
	const [ selectedTitle, setSelectedTitle ] = useState< string >();
	const [ titleOptions, setTitleOptions ] = useState< Option[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
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

	useEffect( () => setTitleOptions( [] ), [ contextData ] );

	const handleTitleGenerate = useCallback( async () => {
		setIsBusy( true );
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
		if ( contextData ) {
			addMessage( {
				content: __(
					'Here are two suggestions based on your keywords. Select the one you prefer:',
					'jetpack'
				),
			} );
		} else {
			addMessage( {
				content: __( 'Here are two suggestions. Select the one you prefer:', 'jetpack' ),
			} );
		}
		setTitleOptions( newTitles || titleOptions );
		setIsBusy( false );
	}, [ titleOptions, addMessage, removeLastMessage, contextData, setIsBusy ] );

	const replaceOptionsWithFauxUseMessages = useCallback( () => {
		const optionsMessage = {
			id: 'title-options-' + Math.random(),
			content: '',
			type: 'past-options',
			options: [],
			showIcon: false,
		};
		// removeLastMessage();
		titleOptions.forEach( titleOption => {
			optionsMessage.options.push( { ...titleOption } );
		} );
		addMessage( optionsMessage );
	}, [ titleOptions, addMessage ] );

	const handleTitleRegenerate = useCallback( async () => {
		// let the controller know we're working
		setIsBusy( true );

		// This would typically be an async call to generate new titles
		replaceOptionsWithFauxUseMessages();
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
		setIsBusy( false );
	}, [ addMessage, removeLastMessage, replaceOptionsWithFauxUseMessages, setIsBusy ] );

	const handleTitleSubmit = useCallback( async () => {
		replaceOptionsWithFauxUseMessages();
		addMessage( { content: <TypingMessage /> } );
		await editPost( { title: selectedTitle, meta: { jetpack_seo_html_title: selectedTitle } } );
		removeLastMessage();
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		setCompleted( true );
		if ( onStep ) {
			onStep( { value: selectedTitle } );
		}
	}, [
		selectedTitle,
		onStep,
		addMessage,
		replaceOptionsWithFauxUseMessages,
		editPost,
		removeLastMessage,
	] );

	const handleSkip = useCallback( () => {
		if ( titleOptions.length ) {
			replaceOptionsWithFauxUseMessages();
		}
		addMessage( __( 'Skipped!', 'jetpack' ) );
		if ( onStep ) {
			onStep();
		}
	}, [ addMessage, onStep, titleOptions, replaceOptionsWithFauxUseMessages ] );

	return {
		id: 'title',
		title: __( 'Optimise Title', 'jetpack' ),
		messages: [
			{
				content: __( "Let's optimise your title.", 'jetpack' ),
				showIcon: true,
			},
		],
		type: 'options',
		options: titleOptions,
		onSelect: handleTitleSelect,
		onSubmit: handleTitleSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: handleTitleRegenerate,
		onRetryCtaLabel: __( 'Regenerate', 'jetpack' ),
		onStart: handleTitleGenerate,
		onSkip: handleSkip,
		value: selectedTitle,
		setValue: setSelectedTitle,
		completed,
		setCompleted,
	};
};
