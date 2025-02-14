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
import debugFactory from 'debug';
/*
 * Internal dependencies
 */
import { useMessages } from './wizard-messages';
import type { Step, OptionMessage } from './types';

const debug = debugFactory( 'jetpack-seo:use-alt-text-step' );

const mockAltTextRequest = ( keywords: string ) => {
	return new Promise< string >( resolve => {
		setTimeout( () => {
			resolve( JSON.stringify( { titles: [ 'Image of ' + keywords ] } ) );
		}, 1000 );
	} );
};

export const useAltTextStep = ( {
	clientId,
	contextValue,
	mockRequests = true,
	imageUrl,
}: {
	contextValue: string;
	mockRequests?: boolean;
	clientId: string;
	imageUrl: string;
} ): Step => {
	const [ value, setValue ] = useState< string >( '' );
	const [ selectedValue, setSelectedValue ] = useState< string >( '' );
	const [ options, setOptions ] = useState< OptionMessage[] >( [] );
	const { selectBlock, updateBlockAttributes } = useDispatch( 'core/editor' );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
	const [ lastContextValue, setLastContextValue ] = useState< string >( '' );
	const postContent = usePostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const [ generatedCount, setGeneratedCount ] = useState( 0 );
	const [ hasFailed, setHasFailed ] = useState( false );
	const [ failurePoint, setFailurePoint ] = useState< 'generate' | 'regenerate' | null >( null );
	const { tracks } = useAnalytics();

	debug( 'clientId', clientId );

	const prevStepHasChanged = useMemo(
		() => contextValue !== lastContextValue,
		[ contextValue, lastContextValue ]
	);
	const stepId = 'alt-text';

	const request = useCallback( async () => {
		if ( mockRequests ) {
			debug( 'mock request', imageUrl );
			return mockAltTextRequest( contextValue );
		}
		tracks.recordEvent( 'jetpack_wizard_chat_request', {
			step: stepId,
			context: contextValue,
			assistant_name: 'seo-assistant',
		} );
		return askQuestionSync(
			[
				{
					role: 'jetpack-ai' as const,
					context: {
						type: 'seo-title',
						content: postContent,
						keywords: contextValue.split( ',' ),
					},
				},
			],
			{
				postId,
				feature: 'jetpack-seo-assistant',
			}
		);
	}, [ contextValue, postContent, postId, mockRequests, tracks, imageUrl ] );

	const handleAltTextSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedValue( option.content as string );
			setSelectedMessage( option );
			setOptions( prev => prev.map( o => ( { ...o, selected: o.id === option.id } ) ) );
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

	const handleAltTextGenerate = useCallback(
		async ( { fromSkip } ) => {
			let newOptions = [ ...options ];
			const previousLastValue = lastContextValue;

			setLastContextValue( contextValue );

			selectBlock( clientId );
			if ( ! hasFailed ) {
				const initialMessage = fromSkip
					? {
							content: createInterpolateElement(
								__(
									"Skipped!<br />Next, let's add the missing alt text for one of your images.",
									'jetpack'
								),
								{ br: <br /> }
							),
							showIcon: true,
					  }
					: {
							content: __(
								"Next, let's add the missing alt text for one of your images.",
								'jetpack'
							),
							showIcon: true,
					  };
				setMessages( [ initialMessage ] );
			}

			// we only generate if options are empty
			if ( newOptions.length === 0 || prevStepHasChanged ) {
				try {
					setSelectedValue( '' );
					setHasFailed( false );
					newOptions = await getTitles();
				} catch {
					setFailurePoint( 'generate' );
					setHasFailed( true );
					// reset the last value to the previous value on failure to avoid a wrong value for prevStepHasChanged
					setLastContextValue( previousLastValue );
					return;
				}
			}

			const readyMessageSuffix = createInterpolateElement(
				__( "<br />Here's a suggestion", 'jetpack' ),
				{ br: <br /> }
			);

			editLastMessage( readyMessageSuffix, true );

			if ( newOptions.length ) {
				// this sets the title options for internal state
				setOptions( newOptions );
				// this adds title options as message-buttons
				newOptions.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
			}
			return value;
		},
		[
			options,
			lastContextValue,
			contextValue,
			hasFailed,
			prevStepHasChanged,
			editLastMessage,
			value,
			setMessages,
			getTitles,
			addMessage,
			selectBlock,
			clientId,
		]
	);

	const handleAltTextRegenerate = useCallback( async () => {
		try {
			setHasFailed( false );
			const newTitles = await getTitles();

			setOptions( [ ...options, ...newTitles ] );
			newTitles.forEach( title => addMessage( { ...title, type: 'option', isUser: true } ) );
		} catch {
			setFailurePoint( 'regenerate' );
			setHasFailed( true );
		}
	}, [ getTitles, options, addMessage ] );

	const handleAltTextSubmit = useCallback( async () => {
		setValue( selectedValue );
		await updateBlockAttributes( clientId, { alt: selectedValue } );
		addMessage( { content: __( 'Title updated! ✅', 'jetpack' ) } );
		return selectedValue;
	}, [ selectedValue, addMessage, clientId, updateBlockAttributes ] );

	const resetState = useCallback( () => {
		setHasFailed( false );
		setFailurePoint( null );
	}, [] );

	// The build fails if we use i18n strings directly in a ternary operator.
	const tryAgainLabel = __( 'Try again', 'jetpack' );
	const regenerateLabel = __( 'Regenerate', 'jetpack' );

	return {
		id: stepId,
		title: __( 'Add image alt text', 'jetpack' ),
		label: __( 'Review image alt text', 'jetpack' ),
		messages,
		type: 'options',
		options,
		onSelect: handleAltTextSelect,
		onSubmit: handleAltTextSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: failurePoint === 'generate' ? handleAltTextGenerate : handleAltTextRegenerate,
		retryCtaLabel: failurePoint === 'generate' ? tryAgainLabel : regenerateLabel,
		onStart: handleAltTextGenerate,
		value,
		setValue,
		includeInResults: true,
		hasSelection: !! selectedValue,
		hasFailed,
		resetState,
	};
};
