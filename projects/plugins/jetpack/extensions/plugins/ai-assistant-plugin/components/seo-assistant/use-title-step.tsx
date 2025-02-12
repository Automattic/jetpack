/*
 * External dependencies
 */
import { askQuestionSync, usePostContent } from '@automattic/jetpack-ai-client';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useState, createInterpolateElement, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import { useMessages } from './wizard-messages';
import type { Step, OptionMessage } from './types';

const mockTitleRequest = ( keywords: string ) => {
	return new Promise< string >( resolve => {
		setTimeout( () => {
			resolve(
				JSON.stringify( { titles: [ 'Title 1 about ' + keywords, 'Title 2 about ' + keywords ] } )
			);
		}, 1000 );
	} );
};

export const useTitleStep = ( {
	keywords,
	mockRequests = false,
}: {
	keywords: string;
	mockRequests?: boolean;
} ): Step => {
	const [ value, setValue ] = useState< string >( '' );
	const [ selectedTitle, setSelectedTitle ] = useState< string >( '' );
	const [ titleOptions, setTitleOptions ] = useState< OptionMessage[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
	const [ lastValue, setLastValue ] = useState< string >( '' );
	const postContent = usePostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const [ generatedCount, setGeneratedCount ] = useState( 0 );

	const prevStepHasChanged = useMemo( () => keywords !== lastValue, [ keywords, lastValue ] );

	const request = useCallback( async () => {
		if ( mockRequests ) {
			return mockTitleRequest( keywords );
		}
		return askQuestionSync(
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
	}, [ keywords, postContent, postId, mockRequests ] );

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
		async ( { fromSkip } ) => {
			let newTitles = [ ...titleOptions ];

			setLastValue( keywords );
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

			// we only generate if options are empty
			if ( newTitles.length === 0 || prevStepHasChanged ) {
				setSelectedTitle( '' );
				newTitles = await getTitles();
			}

			const readyMessageSuffix = createInterpolateElement(
				__( '<br />Here are two suggestions based on your keywords:', 'jetpack' ),
				{ br: <br /> }
			);

			editLastMessage( readyMessageSuffix, true );

			if ( newTitles.length ) {
				// this sets the title options for internal state
				setTitleOptions( newTitles );
				// this addes title options as message-buttons
				newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
			}
			return value;
		},
		[
			titleOptions,
			prevStepHasChanged,
			keywords,
			setMessages,
			editLastMessage,
			getTitles,
			addMessage,
			value,
		]
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
