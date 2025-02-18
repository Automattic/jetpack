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
/**
 * Types
 */
import type { Step, OptionMessage } from './types';
import type { Block } from '@automattic/jetpack-ai-client';

const mockAltTextRequest = ( keywords: string ) => {
	return new Promise< string >( resolve => {
		setTimeout( () => {
			resolve( JSON.stringify( { titles: [ 'Image of ' + keywords ] } ) );
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
	// Create arrays of state for each image block
	const [ values, setValues ] = useState< string[] >( imageBlocks.map( () => '' ) );
	const [ selectedValues, setSelectedValues ] = useState< string[] >( imageBlocks.map( () => '' ) );
	const [ optionsArray, setOptionsArray ] = useState< OptionMessage[][] >(
		imageBlocks.map( () => [] )
	);
	const [ lastValue, setLastValue ] = useState< string >( '' );
	const [ generatedCounts, setGeneratedCounts ] = useState< number[] >(
		imageBlocks.map( () => 0 )
	);
	const [ hasFailedArray, setHasFailedArray ] = useState< boolean[] >(
		imageBlocks.map( () => false )
	);
	const [ failurePoints, setFailurePoints ] = useState< Array< 'generate' | 'regenerate' | null > >(
		imageBlocks.map( () => null )
	);

	const { selectBlock, updateBlockAttributes } = useDispatch( 'core/editor' );
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
			setSelectedValues( prev => {
				const next = [ ...prev ];
				next[ index ] = option.content as string;
				return next;
			} );
			setSelectedMessage( option, index );
			setOptionsArray( prev => {
				const next = [ ...prev ];
				next[ index ] = prev[ index ].map( o => ( { ...o, selected: o.id === option.id } ) );
				return next;
			} );
		},
		[ setSelectedMessage ]
	);

	const getAltTexts = useCallback(
		async ( index: number ) => {
			const imageBlock = imageBlocks[ index ];
			const response = await request( imageBlock );
			const parsedResponse: { texts: string[] } = JSON.parse( response );
			const count = parsedResponse.texts?.length;
			const newAltTexts = parsedResponse.texts.map( ( altText, altIndex ) => ( {
				id: `alt-text-${ generatedCounts[ index ] + count + altIndex }`,
				content: altText,
			} ) );

			setGeneratedCounts( prev => {
				const next = [ ...prev ];
				next[ index ] = prev[ index ] + count;
				return next;
			} );

			return newAltTexts;
		},
		[ generatedCounts, imageBlocks, request ]
	);

	useEffect( () => {
		if ( ! hasFailedArray.some( hasFailed => hasFailed ) ) {
			// Reset the failure point when the request is successful
			setFailurePoints( Array( hasFailedArray.length ).fill( null ) );
		}
	}, [ hasFailedArray ] );

	const handleAltTextGenerate = useCallback(
		async ( index: number, { fromSkip }: { fromSkip: boolean } ) => {
			let newOptions = [ ...optionsArray[ index ] ];
			const previousLastValue = lastValue;

			if ( index === 0 ) {
				setLastValue( keywords );
			}

			const imageBlock = imageBlocks[ index ];
			selectBlock( imageBlock.clientId );

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
					setSelectedValues( prev => {
						const next = [ ...prev ];
						next[ index ] = '';
						return next;
					} );
					setHasFailedArray( prev => {
						const next = [ ...prev ];
						next[ index ] = false;
						return next;
					} );
					newOptions = await getAltTexts( index );
				} catch {
					setFailurePoints( prev => {
						const next = [ ...prev ];
						next[ index ] = 'generate';
						return next;
					} );
					setHasFailedArray( prev => {
						const next = [ ...prev ];
						next[ index ] = true;
						return next;
					} );
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
				setOptionsArray( prev => {
					const next = [ ...prev ];
					next[ index ] = newOptions;
					return next;
				} );
				// this adds title options as message-buttons
				newOptions.forEach( title =>
					addMessage( { ...title, type: 'option', isUser: true }, index )
				);
			}
			return values[ index ];
		},
		[
			optionsArray,
			lastValue,
			imageBlocks,
			selectBlock,
			hasFailedArray,
			prevStepHasChanged,
			editLastMessage,
			values,
			keywords,
			setMessages,
			getAltTexts,
			addMessage,
		]
	);

	const handleAltTextRegenerate = useCallback(
		async ( index: number ) => {
			try {
				setHasFailedArray( prev => {
					const next = [ ...prev ];
					next[ index ] = false;
					return next;
				} );
				const newAltTexts = await getAltTexts( index );

				setOptionsArray( prev => {
					const next = [ ...prev ];
					next[ index ] = [ ...optionsArray[ index ], ...newAltTexts ];
					return next;
				} );
				newAltTexts.forEach( title =>
					addMessage( { ...title, type: 'option', isUser: true }, index )
				);
			} catch {
				setFailurePoints( prev => {
					const next = [ ...prev ];
					next[ index ] = 'regenerate';
					return next;
				} );
				setHasFailedArray( prev => {
					const next = [ ...prev ];
					next[ index ] = true;
					return next;
				} );
			}
		},
		[ getAltTexts, optionsArray, addMessage ]
	);

	const handleAltTextSubmit = useCallback(
		async ( index: number ) => {
			const imageBlock = imageBlocks[ index ];

			setValues( prev => {
				const next = [ ...prev ];
				next[ index ] = selectedValues[ index ];
				return next;
			} );
			await updateBlockAttributes( imageBlock.clientId, { alt: selectedValues[ index ] } );
			addMessage( { content: __( 'Alt text updated! ✅', 'jetpack' ) }, index );
			return selectedValues[ index ];
		},
		[ selectedValues, addMessage, imageBlocks, updateBlockAttributes ]
	);

	const resetState = useCallback( ( index: number ) => {
		setHasFailedArray( prev => {
			const next = [ ...prev ];
			next[ index ] = false;
			return next;
		} );
		setFailurePoints( prev => {
			const next = [ ...prev ];
			next[ index ] = null;
			return next;
		} );
	}, [] );

	// The build fails if we use i18n strings directly in a ternary operator.
	const tryAgainLabel = __( 'Try again', 'jetpack' );
	const regenerateLabel = __( 'Regenerate', 'jetpack' );

	// Create steps array
	const steps: Step[] = useMemo(
		() =>
			imageBlocks.map( ( imageBlock, index ) => ( {
				id: `${ stepId }-${ index }`,
				title: __( 'Add image alt text', 'jetpack' ),
				label: __( 'Review image alt text', 'jetpack' ),
				messages: getMessages( index ),
				type: 'options',
				options: optionsArray[ index ],
				onSelect: ( option: OptionMessage ) => handleAltTextSelect( option, index ),
				onSubmit: () => handleAltTextSubmit( index ),
				submitCtaLabel: __( 'Insert', 'jetpack' ),
				onRetry:
					failurePoints[ index ] === 'generate'
						? () => handleAltTextGenerate( index, { fromSkip: false } )
						: () => handleAltTextRegenerate( index ),
				retryCtaLabel: failurePoints[ index ] === 'generate' ? tryAgainLabel : regenerateLabel,
				onStart: () => handleAltTextGenerate( index, { fromSkip: false } ),
				value: values[ index ],
				setValue: ( newValue: string ) => {
					setValues( prev => {
						const next = [ ...prev ];
						next[ index ] = newValue;
						return next;
					} );
				},
				includeInResults: true,
				hasSelection: !! selectedValues[ index ],
				hasFailed: hasFailedArray[ index ],
				resetState: () => resetState( index ),
			} ) ),
		[
			imageBlocks,
			getMessages,
			optionsArray,
			failurePoints,
			tryAgainLabel,
			regenerateLabel,
			values,
			selectedValues,
			hasFailedArray,
			handleAltTextSelect,
			handleAltTextSubmit,
			handleAltTextGenerate,
			handleAltTextRegenerate,
			resetState,
		]
	);

	return steps;
};
