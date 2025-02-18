/*
 * External dependencies
 */
import { askQuestionSync, usePostContent } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import {
	useCallback,
	useState,
	createInterpolateElement,
	useMemo,
	useEffect,
} from '@wordpress/element';
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
	const [ valueOptions, setValueOptions ] = useState< OptionMessage[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
	const [ lastValue, setLastValue ] = useState< string >( '' );
	const postContent = usePostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const [ generatedCount, setGeneratedCount ] = useState( 0 );
	const [ hasFailed, setHasFailed ] = useState( false );
	const [ failurePoint, setFailurePoint ] = useState< 'generate' | 'regenerate' | null >( null );
	const { tracks } = useAnalytics();

	const prevStepHasChanged = useMemo( () => keywords !== lastValue, [ keywords, lastValue ] );
	const stepId = 'title';

	const request = useCallback( async () => {
		if ( mockRequests ) {
			return mockTitleRequest( keywords );
		}
		tracks.recordEvent( 'jetpack_wizard_chat_request', {
			step: stepId,
			context: keywords,
			assistant_name: 'seo-assistant',
		} );
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
				feature: 'jetpack-seo-assistant',
			}
		);
	}, [ keywords, postContent, postId, mockRequests, tracks ] );

	const handleTitleSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedTitle( option.content as string );
			setSelectedMessage( option );
			setValueOptions( prev => prev.map( o => ( { ...o, selected: o.id === option.id } ) ) );
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

	useEffect( () => {
		if ( ! hasFailed ) {
			// Reset the failure point when the request is successful
			setFailurePoint( null );
		}
	}, [ hasFailed ] );

	const handleTitleGenerate = useCallback(
		async ( { fromSkip } ) => {
			let newTitles = [ ...valueOptions ];
			const previousLastValue = lastValue;

			setLastValue( keywords );

			if ( ! hasFailed ) {
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
			}

			// we only generate if options are empty
			if ( newTitles.length === 0 || prevStepHasChanged ) {
				try {
					setSelectedTitle( '' );
					setHasFailed( false );
					newTitles = await getTitles();
				} catch {
					setFailurePoint( 'generate' );
					setHasFailed( true );
					// reset the last value to the previous value on failure to avoid a wrong value for prevStepHasChanged
					setLastValue( previousLastValue );
					return;
				}
			}

			const readyMessageSuffix = createInterpolateElement(
				__( '<br />Here are two suggestions based on your keywords:', 'jetpack' ),
				{ br: <br /> }
			);

			editLastMessage( readyMessageSuffix, true );

			if ( newTitles.length ) {
				// this sets the title options for internal state
				setValueOptions( newTitles );
				// this adds title options as message-buttons
				newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
			}
			return value;
		},
		[
			valueOptions,
			lastValue,
			keywords,
			hasFailed,
			prevStepHasChanged,
			editLastMessage,
			value,
			setMessages,
			getTitles,
			addMessage,
		]
	);

	const handleTitleRegenerate = useCallback( async () => {
		try {
			setHasFailed( false );
			const newTitles = await getTitles();

			setValueOptions( [ ...valueOptions, ...newTitles ] );
			newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
		} catch {
			setFailurePoint( 'regenerate' );
			setHasFailed( true );
		}
	}, [ getTitles, valueOptions, addMessage ] );

	const handleTitleSubmit = useCallback( async () => {
		setValue( selectedTitle );
		await editPost( { title: selectedTitle, meta: { jetpack_seo_html_title: selectedTitle } } );
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		return selectedTitle;
	}, [ selectedTitle, addMessage, editPost ] );

	const resetState = useCallback( () => {
		setHasFailed( false );
		setFailurePoint( null );
	}, [] );

	// The build fails if we use i18n strings directly in a ternary operator.
	const tryAgainLabel = __( 'Try again', 'jetpack' );
	const regenerateLabel = __( 'Regenerate', 'jetpack' );

	return {
		id: stepId,
		title: __( 'Optimise Title', 'jetpack' ),
		label: __( 'Title', 'jetpack' ),
		messages,
		type: 'options',
		options: valueOptions,
		onSelect: handleTitleSelect,
		onSubmit: handleTitleSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: failurePoint === 'generate' ? handleTitleGenerate : handleTitleRegenerate,
		retryCtaLabel: failurePoint === 'generate' ? tryAgainLabel : regenerateLabel,
		onStart: handleTitleGenerate,
		value,
		setValue,
		includeInResults: true,
		hasSelection: !! selectedTitle,
		hasFailed,
		resetState,
	};
};
