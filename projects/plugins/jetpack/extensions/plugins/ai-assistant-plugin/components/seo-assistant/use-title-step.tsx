import { useDispatch } from '@wordpress/data';
import { useCallback, useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import { useMessages } from './wizard-messages';
import type { Step, Option } from './types';

export const useTitleStep = (): Step => {
	const [ selectedTitle, setSelectedTitle ] = useState< string >();
	const [ titleOptions, setTitleOptions ] = useState< Option[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const { messages, setMessages, addMessage, removeLastMessage, editLastMessage } = useMessages();
	const [ completed, setCompleted ] = useState( false );
	const [ prevStepValue, setPrevStepValue ] = useState( '' );

	const handleTitleSelect = useCallback( ( option: Option ) => {
		setSelectedTitle( option.content );
		setTitleOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

	const handleTitleGenerate = useCallback(
		async ( { fromSkip, stepValue: keywords } ) => {
			const prevStepHasChanged = keywords !== prevStepValue;
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
			if ( prevStepHasChanged ) {
				setTitleOptions( [] );
			}
			let newTitles;
			// we only generate if options are empty
			if ( titleOptions.length === 0 || prevStepHasChanged ) {
				setPrevStepValue( keywords );
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
			setTitleOptions( newTitles || titleOptions );
		},
		[ titleOptions, addMessage, removeLastMessage, setMessages, prevStepValue, editLastMessage ]
	);

	const handleTitleRegenerate = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		const newTitles = await new Promise< Array< Option > >( resolve =>
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
	}, [ addMessage, removeLastMessage, titleOptions ] );

	const handleTitleSubmit = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		await editPost( { title: selectedTitle, meta: { jetpack_seo_html_title: selectedTitle } } );
		removeLastMessage();
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		setCompleted( true );
		return selectedTitle;
	}, [ selectedTitle, addMessage, editPost, removeLastMessage ] );

	const handleSkip = useCallback( () => {
		// addMessage( { content: __( 'Skipped!', 'jetpack' ) } );
	}, [] );

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
