/*
 * External dependencies
 */
import { askQuestionSync, usePostContent } from '@automattic/jetpack-ai-client';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import { useMessages } from './wizard-messages';
import type { Step, OptionMessage } from './types';

export const useTitleStep = ( { keywords }: { keywords: string } ): Step => {
	const [ value, setValue ] = useState< string >( '' );
	const [ selectedTitle, setSelectedTitle ] = useState< string >( '' );
	const [ titleOptions, setTitleOptions ] = useState< OptionMessage[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
	const [ prevStepValue, setPrevStepValue ] = useState();
	const postContent = usePostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const [ generatedCount, setGeneratedCount ] = useState( 0 );

	const request = useCallback( async () => {
		const response = await askQuestionSync(
			[
				{
					role: 'jetpack-ai' as const,
					context: {
						type: 'seo-title',
						content: postContent,
						keywords: keywords.split( ',' ),
					},
				},
			],
			{
				postId,
				feature: 'seo-title',
			}
		);

		return response;
	}, [ keywords, postContent, postId ] );

	const handleTitleSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedTitle( option.content as string );
			setSelectedMessage( option );
			setTitleOptions( prev => prev.map( o => ( { ...o, selected: o.id === option.id } ) ) );
		},
		[ setSelectedMessage ]
	);

	const getTitles = useCallback( async () => {
		const response = await request();
		// TODO: handle errors
		const parsedResponse: { titles: string[] } = JSON.parse( response );
		const count = parsedResponse.titles?.length;
		const newTitles = parsedResponse.titles.map( ( title, index ) => ( {
			id: `title-${ generatedCount + count + index }`,
			content: title,
		} ) );

		setGeneratedCount( current => current + count );

		return newTitles;
	}, [ generatedCount, request ] );

	const handleTitleGenerate = useCallback(
		async ( { fromSkip, stepValue: stepKeywords } ) => {
			const prevStepHasChanged = stepKeywords !== prevStepValue;

			if ( ! prevStepHasChanged ) {
				return;
			}

			setPrevStepValue( stepKeywords );
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
				newTitles = await getTitles();
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
		[ prevStepValue, setMessages, titleOptions, editLastMessage, getTitles, addMessage ]
	);

	const handleTitleRegenerate = useCallback( async () => {
		const newTitles = await getTitles();

		setTitleOptions( [ ...titleOptions, ...newTitles ] );
		newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
	}, [ addMessage, getTitles, titleOptions ] );

	const handleTitleSubmit = useCallback( async () => {
		setValue( selectedTitle );
		await editPost( { title: selectedTitle, meta: { jetpack_seo_html_title: selectedTitle } } );
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		return selectedTitle;
	}, [ selectedTitle, addMessage, editPost ] );

	return {
		id: 'title',
		title: __( 'Optimise Title', 'jetpack' ),
		label: __( 'Title', 'jetpack' ),
		messages,
		type: 'options',
		options: titleOptions,
		onSelect: handleTitleSelect,
		onSubmit: handleTitleSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: handleTitleRegenerate,
		retryCtaLabel: __( 'Regenerate', 'jetpack' ),
		onStart: handleTitleGenerate,
		value,
		setValue,
		includeInResults: true,
		hasSelection: !! selectedTitle,
	};
};
