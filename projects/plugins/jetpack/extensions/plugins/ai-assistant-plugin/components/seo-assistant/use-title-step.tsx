import { useDispatch } from '@wordpress/data';
import { useCallback, useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMessages } from './wizard-messages';
import type { Step, OptionMessage } from './types';

export const useTitleStep = (): Step => {
	const [ selectedTitle, setSelectedTitle ] = useState< string >( '' );
	const [ titleOptions, setTitleOptions ] = useState< OptionMessage[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
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
							__( "Skipped!<br />Let's optimise your title first.", 'jetpack' ),
							{ br: <br /> }
						),
						showIcon: true,
				  }
				: {
						content: __( "Let's optimise your title first.", 'jetpack' ),
						showIcon: true,
				  };
			setMessages( [ initialMessage ] );
			let newTitles = [ ...titleOptions ];
			// we only generate if options are empty
			if ( newTitles.length === 0 || prevStepHasChanged ) {
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
						3000
					)
				);
			}
			let editedMessage;

			if ( fromSkip ) {
				editedMessage = createInterpolateElement(
					__(
						"Skipped!<br />Let's optimise your title first.<br />Here are two suggestions based on your keywords:",
						'jetpack'
					),
					{ br: <br /> }
				);
			} else {
				editedMessage = createInterpolateElement(
					__(
						"Let's optimise your title first.<br />Here are two suggestions based on your keywords:",
						'jetpack'
					),
					{ br: <br /> }
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
		[ titleOptions, addMessage, setMessages, prevStepValue, editLastMessage ]
	);

	const handleTitleRegenerate = useCallback( async () => {
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
		setTitleOptions( [ ...titleOptions, ...newTitles ] );
		newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
	}, [ addMessage, titleOptions ] );

	const handleTitleSubmit = useCallback( async () => {
		await editPost( { title: selectedTitle, meta: { jetpack_seo_html_title: selectedTitle } } );
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		setCompleted( true );
		return selectedTitle;
	}, [ selectedTitle, addMessage, editPost ] );

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
