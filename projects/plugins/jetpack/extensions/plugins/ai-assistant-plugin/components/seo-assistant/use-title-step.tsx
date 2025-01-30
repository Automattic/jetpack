import { useDispatch } from '@wordpress/data';
import { useCallback, useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { Step, OptionMessage } from './types';

export const useTitleStep = (): Step => {
	const [ selectedTitle, setSelectedTitle ] = useState< string >( '' );
	const [ titleOptions, setTitleOptions ] = useState< OptionMessage[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const {
		messages,
		setMessages,
		addMessage,
		removeLastMessage,
		editLastMessage,
		setSelectedMessage,
	} = useMessages();
	const [ completed, setCompleted ] = useState( false );
	const [ prevStepValue, setPrevStepValue ] = useState();

	const handleTitleSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedTitle( option.content as string );
			setSelectedMessage( option );
		},
		[ setSelectedMessage ]
	);

	const handleTitleGenerate = useCallback(
		async ( { fromSkip, stepValue: keywords } ) => {
			const prevStepHasChanged = keywords !== prevStepValue;
			if ( ! prevStepHasChanged ) {
				return;
			}
			setPrevStepValue( keywords );
			const initialMessage = fromSkip
				? {
						content: createInterpolateElement(
							__( "Skipped!<br />Let's optimise your title.", 'jetpack' ),
							{ br: <br /> }
						),
						showIcon: true,
				  }
				: {
						content: __( "Let's optimise your title.", 'jetpack' ),
						showIcon: true,
				  };
			setMessages( [ initialMessage ] );
			let newTitles = [ ...titleOptions ];
			// we only generate if options are empty
			if ( newTitles.length === 0 || prevStepHasChanged ) {
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
			let editedMessage;
			if ( keywords ) {
				if ( fromSkip ) {
					editedMessage = createInterpolateElement(
						__(
							'Skipped!<br />Here are some suggestions for a better title based on your keywords:',
							'jetpack'
						),
						{ br: <br /> }
					);
				} else {
					editedMessage = __(
						'Here are some suggestions for a better title based on your keywords:',
						'jetpack'
					);
				}
			} else if ( fromSkip ) {
				editedMessage = createInterpolateElement(
					__(
						'Skipped!<br />Here are some suggestions for a better title based on your post:',
						'jetpack'
					),
					{ br: <br /> }
				);
			} else {
				editedMessage = __(
					'Here are some suggestions for a better title based on your post:',
					'jetpack'
				);
			}
			editLastMessage( editedMessage );
			if ( newTitles.length ) {
				// this sets the title options for internal state
				setTitleOptions( newTitles );
				// this addes title options as message-buttons
				newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
			}
		},
		[ titleOptions, addMessage, removeLastMessage, setMessages, prevStepValue, editLastMessage ]
	);

	const handleTitleRegenerate = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		const newTitles = await new Promise< Array< OptionMessage > >( resolve =>
			setTimeout(
				() =>
					resolve( [
						{
							id: '1' + Math.random(),
							content: 'A Photo Gallery for Gardening Enthusiasths: Flora Guide',
						},
						{
							id: '2' + Math.random(),
							content:
								'Flora Guide: Beautiful Photos of Flowers and Plants for Gardening Enthusiasts',
						},
					] ),
				2000
			)
		);
		removeLastMessage();
		setTitleOptions( [ ...titleOptions, ...newTitles ] );
		newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
	}, [ addMessage, removeLastMessage, titleOptions ] );

	const handleTitleSubmit = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		await editPost( { title: selectedTitle, meta: { jetpack_seo_html_title: selectedTitle } } );
		removeLastMessage();
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		setCompleted( true );
		return selectedTitle;
	}, [ selectedTitle, addMessage, editPost, removeLastMessage ] );

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
		value: selectedTitle,
		setValue: setSelectedTitle,
		completed,
		setCompleted,
	};
};
