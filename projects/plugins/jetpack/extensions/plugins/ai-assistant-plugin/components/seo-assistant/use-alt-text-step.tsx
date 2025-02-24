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
import openBlockSidebar from './open-block-sidebar';
import { useArrayState } from './use-array-state';
import { useMessages } from './wizard-messages';
/**
 * Types
 */
import type { Step, OptionMessage } from './types';
import type { Block } from '@automattic/jetpack-ai-client';

const debug = debugFactory( 'jetpack-seo:alt-text' );

const mockAltTextRequest = ( keywords: string ) => {
	return new Promise< string >( resolve => {
		setTimeout( () => {
			resolve( JSON.stringify( { texts: [ 'Image of ' + keywords ] } ) );
		}, 1000 );
	} );
};

export const useAltTextStep = ( {
	keywords,
	mockRequests = false,
	imageBlocks = [],
}: {
	keywords: string;
	mockRequests?: boolean;
	imageBlocks: Block[];
} ): Step[] => {
	// Each image block has its own step, hence the array of states
	const [ valuesArray, setValues ] = useArrayState< string >( imageBlocks.map( () => '' ) );
	const [ selectedValuesArray, setSelectedValues ] = useArrayState< string >(
		imageBlocks.map( () => '' )
	);
	const [ optionsArray, setOptions ] = useArrayState< OptionMessage[] >(
		imageBlocks.map( () => [] )
	);
	const [ generatedCountsArray, setGeneratedCounts ] = useArrayState< number >(
		imageBlocks.map( () => 0 )
	);
	const [ hasFailedArray, setHasFailed ] = useArrayState< boolean >(
		imageBlocks.map( () => false )
	);
	const [ failurePointsArray, setFailurePoints ] = useArrayState<
		'generate' | 'regenerate' | null
	>( imageBlocks.map( () => null ) );
	const [ lastValue, setLastValue ] = useState< string >( '' );
	const { updateBlockAttributes } = useDispatch( 'core/editor' );
	const { getMessages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages(
		imageBlocks.length
	);
	const postContent = usePostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const { tracks } = useAnalytics();
	const prevStepHasChanged = useMemo( () => keywords !== lastValue, [ keywords, lastValue ] );
	const stepId = 'alt-text';

	const request = useCallback(
		async ( imageBlock: Block ) => {
			if ( mockRequests ) {
				return mockAltTextRequest( keywords );
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
							type: 'images-alt-text',
							content: postContent,
							keywords: keywords.split( ',' ),
							images: [
								{
									url: imageBlock.attributes.url,
								},
							],
						},
					},
				],
				{
					postId,
					feature: 'jetpack-seo-assistant',
				}
			);
		},
		[ mockRequests, tracks, keywords, postId, postContent ]
	);

	const handleAltTextSelect = useCallback(
		( option: OptionMessage, index: number ) => {
			setSelectedValues( option.content as string, index );
			setSelectedMessage( option, index );
			setOptions( prev => prev.map( o => ( { ...o, selected: o.id === option.id } ) ), index );
		},
		[ setOptions, setSelectedMessage, setSelectedValues ]
	);

	const getAltTexts = useCallback(
		async ( index: number ) => {
			const imageBlock = imageBlocks[ index ];
			const response = await request( imageBlock );
			const parsedResponse: { texts: string[] } = JSON.parse( response );
			const count = parsedResponse.texts?.length;
			const newAltTexts = parsedResponse.texts.map( ( altText, altIndex ) => ( {
				id: `alt-text-${ generatedCountsArray[ index ] + count + altIndex }`,
				content: altText,
			} ) );

			setGeneratedCounts( prev => prev + count, index );

			return newAltTexts;
		},
		[ generatedCountsArray, imageBlocks, request, setGeneratedCounts ]
	);

	useEffect( () => {
		if ( ! hasFailedArray.some( hasFailed => hasFailed ) ) {
			// Reset the failure point when the request is successful
			imageBlocks.forEach( ( _, index ) => {
				setFailurePoints( null, index );
			} );
		}
	}, [ hasFailedArray, imageBlocks, setFailurePoints ] );

	const selectBlock = useCallback(
		( index: number ) => {
			openBlockSidebar( imageBlocks[ index ].clientId );
		},
		[ imageBlocks ]
	);

	const handleAltTextGenerate = useCallback(
		async ( index: number, { fromSkip }: { fromSkip: boolean } ) => {
			let newOptions = [ ...optionsArray[ index ] ];
			const previousLastValue = lastValue;

			if ( index === 0 ) {
				setLastValue( keywords );
			}

			selectBlock( index );

			if ( ! hasFailedArray[ index ] ) {
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
				setMessages( [ initialMessage ], index );
			}

			// we only generate if options are empty
			if ( newOptions.length === 0 || prevStepHasChanged ) {
				try {
					setSelectedValues( '', index );
					setHasFailed( false, index );
					newOptions = await getAltTexts( index );
				} catch ( error ) {
					debug( 'Error generating alt text', error );
					setFailurePoints( 'generate', index );
					setHasFailed( true, index );

					// reset the last value to the previous value on failure to avoid a wrong value for prevStepHasChanged
					if ( index === 0 ) {
						setLastValue( previousLastValue );
					}

					return;
				}
			}

			const readyMessageSuffix = createInterpolateElement(
				__( "<br />Here's a suggestion", 'jetpack' ),
				{ br: <br /> }
			);

			editLastMessage( readyMessageSuffix, true, index );

			if ( newOptions.length ) {
				// this sets the title options for internal state
				setOptions( newOptions, index );
				// this adds title options as message-buttons
				newOptions.forEach( title =>
					addMessage( { ...title, type: 'option', isUser: true }, index )
				);
			}
			return valuesArray[ index ];
		},
		[
			optionsArray,
			lastValue,
			selectBlock,
			hasFailedArray,
			prevStepHasChanged,
			editLastMessage,
			valuesArray,
			keywords,
			setMessages,
			setSelectedValues,
			setHasFailed,
			getAltTexts,
			setFailurePoints,
			setOptions,
			addMessage,
		]
	);

	const handleAltTextRegenerate = useCallback(
		async ( index: number ) => {
			try {
				setHasFailed( false, index );
				const newAltTexts = await getAltTexts( index );
				setOptions( [ ...optionsArray[ index ], ...newAltTexts ], index );

				newAltTexts.forEach( title =>
					addMessage( { ...title, type: 'option', isUser: true }, index )
				);
			} catch {
				setFailurePoints( 'regenerate', index );
				setHasFailed( true, index );
			}
		},
		[ setHasFailed, getAltTexts, setOptions, optionsArray, addMessage, setFailurePoints ]
	);

	const handleAltTextSubmit = useCallback(
		async ( index: number ) => {
			const imageBlock = imageBlocks[ index ];

			setValues( selectedValuesArray[ index ], index );
			await updateBlockAttributes( imageBlock.clientId, { alt: selectedValuesArray[ index ] } );
			addMessage( { content: __( 'Alt text updated! ✅', 'jetpack' ) }, index );

			// Time for the user to see the updated alt text
			if ( index < imageBlocks.length - 1 ) {
				await new Promise( resolve => setTimeout( resolve, 1000 ) );
			}

			return selectedValuesArray[ index ];
		},
		[ imageBlocks, setValues, selectedValuesArray, updateBlockAttributes, addMessage ]
	);

	const resetState = useCallback(
		( index: number ) => {
			setHasFailed( false, index );
			setFailurePoints( null, index );
		},
		[ setHasFailed, setFailurePoints ]
	);

	// The build fails if we use i18n strings directly in a ternary operator.
	const tryAgainLabel = __( 'Try again', 'jetpack' );
	const regenerateLabel = __( 'Regenerate', 'jetpack' );

	// Create steps array
	const steps: Step[] = useMemo(
		() =>
			imageBlocks.map( ( imageBlock, index ) => ( {
				id: `${ stepId }-${ index }`,
				title: __( 'Add Image Alt Text', 'jetpack' ),
				label: __( 'Review Image Alt Text', 'jetpack' ),
				messages: getMessages( index ),
				type: 'options',
				options: optionsArray[ index ],
				onSelect: ( option: OptionMessage ) => handleAltTextSelect( option, index ),
				onSubmit: () => handleAltTextSubmit( index ),
				submitCtaLabel: __( 'Insert', 'jetpack' ),
				onRetry:
					failurePointsArray[ index ] === 'generate'
						? () => handleAltTextGenerate( index, { fromSkip: false } )
						: () => handleAltTextRegenerate( index ),
				retryCtaLabel: failurePointsArray[ index ] === 'generate' ? tryAgainLabel : regenerateLabel,
				onStart: () => handleAltTextGenerate( index, { fromSkip: false } ),
				value: valuesArray[ index ],
				setValue: ( newValue: string ) => {
					setValues( newValue, index );
				},
				includeInResults: true,
				hasSelection: !! selectedValuesArray[ index ],
				hasFailed: hasFailedArray[ index ],
				resetState: () => resetState( index ),
				selectBlock: () => selectBlock( index ),
			} ) ),
		[
			imageBlocks,
			getMessages,
			optionsArray,
			failurePointsArray,
			tryAgainLabel,
			regenerateLabel,
			valuesArray,
			selectedValuesArray,
			hasFailedArray,
			handleAltTextSelect,
			handleAltTextSubmit,
			handleAltTextGenerate,
			handleAltTextRegenerate,
			setValues,
			resetState,
			selectBlock,
		]
	);

	return steps;
};
