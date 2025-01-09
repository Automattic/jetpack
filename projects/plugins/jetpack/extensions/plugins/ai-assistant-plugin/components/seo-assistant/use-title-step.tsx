import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TypingMessage } from './index';
import type { Step, Option } from './index';

export const useTitleStep = ( {
	addMessage,
	removeLastMessage,
	onStep,
} ): {
	stepProps: Step;
	value: string;
	setValue: React.Dispatch< React.SetStateAction< string > >;
} => {
	const [ selectedTitle, setSelectedTitle ] = useState< string >();
	const [ titleOptions, setTitleOptions ] = useState< Option[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );

	const handleTitleSelect = useCallback( ( option: Option ) => {
		setSelectedTitle( option.content );
		setTitleOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

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
			content: 'Here are two suggestions based on your keywords. Select the one you prefer:',
		} );
		setTitleOptions( newTitles || titleOptions );
	}, [ titleOptions, addMessage, removeLastMessage ] );

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
		addMessage( 'Here are two new suggestions based on your keywords. Select the one you prefer:' );
		setTitleOptions( newTitles );
	}, [ addMessage, removeLastMessage, replaceOptionsWithFauxUseMessages ] );

	const handleTitleSubmit = useCallback( () => {
		// addMessage( { content: selectedTitle, isUser: true } );
		editPost( { meta: { jetpack_seo_html_title: selectedTitle } } );
		replaceOptionsWithFauxUseMessages();
		addMessage( __( 'Title updated! ✅', 'jetpack' ) );
		if ( onStep ) {
			onStep( { value: selectedTitle } );
		}
	}, [ selectedTitle, onStep, addMessage, replaceOptionsWithFauxUseMessages, editPost ] );

	return {
		stepProps: {
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
		},
		value: selectedTitle,
		setValue: setSelectedTitle,
	};
};
