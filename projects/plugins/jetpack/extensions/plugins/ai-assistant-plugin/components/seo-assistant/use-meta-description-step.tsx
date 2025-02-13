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

const mockMetaDescriptionRequest = ( keywords: string ) => {
	return new Promise< string >( resolve => {
		setTimeout( () => {
			resolve(
				JSON.stringify( {
					descriptions: [
						'Discover everything you need to know about ' +
							keywords +
							'. Our comprehensive guide covers essential tips, expert advice and practical techniques for success.',
					],
				} )
			);
		}, 1000 );
	} );
};

export const useMetaDescriptionStep = ( {
	keywords,
	mockRequests = false,
}: {
	keywords: string;
	mockRequests?: boolean;
} ): Step => {
	const [ value, setValue ] = useState< string >();
	const [ lastValue, setLastValue ] = useState< string >( '' );
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ valueOptions, setValueOptions ] = useState< OptionMessage[] >( [] );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
	const { editPost } = useDispatch( editorStore );
	const postContent = usePostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const [ generatedCount, setGeneratedCount ] = useState( 0 );
	const [ hasFailed, setHasFailed ] = useState( false );
	const [ failurePoint, setFailurePoint ] = useState< 'generate' | 'regenerate' | null >( null );
	const { tracks } = useAnalytics();
	const prevStepHasChanged = useMemo( () => keywords !== lastValue, [ keywords, lastValue ] );
	const stepId = 'meta';

	const request = useCallback( async () => {
		if ( mockRequests ) {
			return mockMetaDescriptionRequest( keywords );
		}
		tracks.recordEvent( 'jetpack_seo_assistant_request', {
			step: stepId,
			keywords,
		} );
		return askQuestionSync(
			[
				{
					role: 'jetpack-ai' as const,
					context: {
						type: 'seo-meta-description',
						content: postContent,
						keywords: keywords.split( ',' ),
						count: 1,
					},
				},
			],
			{
				postId,
				feature: 'jetpack-seo-assistant',
			}
		);
	}, [ keywords, postContent, postId, mockRequests, tracks ] );

	const handleMetaDescriptionSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedMetaDescription( option.content as string );
			setSelectedMessage( option );
			setValueOptions( prev => prev.map( o => ( { ...o, selected: o.id === option.id } ) ) );
		},
		[ setSelectedMessage ]
	);

	const getMetaDescriptions = useCallback( async () => {
		const response = await request();
		// TODO: handle errors
		const parsedResponse: { descriptions: string[] } = JSON.parse( response );
		const count = parsedResponse.descriptions?.length;
		const newDescriptions = parsedResponse.descriptions.map( ( description, index ) => ( {
			id: `meta-${ generatedCount + count + index }`,
			content: description,
		} ) );

		setGeneratedCount( current => current + count );

		return newDescriptions;
	}, [ generatedCount, request ] );

	const handleMetaDescriptionSubmit = useCallback( async () => {
		setValue( selectedMetaDescription );
		await editPost( { meta: { advanced_seo_description: selectedMetaDescription } } );
		addMessage( { content: __( 'Meta description updated! ✅', 'jetpack' ) } );
		return selectedMetaDescription;
	}, [ selectedMetaDescription, addMessage, editPost ] );

	useEffect( () => {
		if ( ! hasFailed ) {
			// Reset the failure point when the request is successful
			setFailurePoint( null );
		}
	}, [ hasFailed ] );

	const handleMetaDescriptionGenerate = useCallback(
		async ( { fromSkip } ) => {
			let newMetaDescriptions = [ ...valueOptions ];
			const previousLastValue = lastValue;

			setLastValue( keywords );

			if ( ! hasFailed ) {
				const initialMessage = fromSkip
					? {
							content: createInterpolateElement(
								__( "Skipped!<br />Now, let's optimize your meta description.", 'jetpack' ),
								{ br: <br /> }
							),
							showIcon: true,
					  }
					: {
							content: __( "Now, let's optimize your meta description.", 'jetpack' ),
							showIcon: true,
					  };

				setMessages( [ initialMessage ] );
			}

			// we only generate if options are empty
			if ( newMetaDescriptions.length === 0 || prevStepHasChanged ) {
				try {
					setSelectedMetaDescription( '' );
					setHasFailed( false );
					newMetaDescriptions = await getMetaDescriptions();
				} catch {
					setFailurePoint( 'generate' );
					setHasFailed( true );
					// reset the last value to the previous value on failure to avoid a wrong value for prevStepHasChanged
					setLastValue( previousLastValue );
					return;
				}
			}

			setValueOptions( newMetaDescriptions );

			const readyMessageSuffix = createInterpolateElement(
				__( "<br />Here's a suggestion:", 'jetpack' ),
				{ br: <br /> }
			);

			editLastMessage( readyMessageSuffix, true );

			newMetaDescriptions.forEach( meta =>
				addMessage( { ...meta, type: 'option', isUser: true } )
			);
		},
		[
			valueOptions,
			lastValue,
			keywords,
			hasFailed,
			prevStepHasChanged,
			editLastMessage,
			setMessages,
			getMetaDescriptions,
			addMessage,
		]
	);

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		try {
			setHasFailed( false );
			const newMetaDescription = await getMetaDescriptions();

			setValueOptions( prev => [ ...prev, ...newMetaDescription ] );
			newMetaDescription.forEach( meta => addMessage( { ...meta, type: 'option', isUser: true } ) );
		} catch {
			setFailurePoint( 'regenerate' );
			setHasFailed( true );
		}
	}, [ addMessage, getMetaDescriptions ] );

	const resetState = useCallback( () => {
		setHasFailed( false );
		setFailurePoint( null );
	}, [] );

	// The build fails if we use i18n strings directly in a ternary operator.
	const tryAgainLabel = __( 'Try again', 'jetpack' );
	const regenerateLabel = __( 'Regenerate', 'jetpack' );

	return {
		id: stepId,
		title: __( 'Add meta description', 'jetpack' ),
		label: __( 'Meta description', 'jetpack' ),
		messages: messages,
		type: 'options',
		options: valueOptions,
		onSelect: handleMetaDescriptionSelect,
		onSubmit: handleMetaDescriptionSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry:
			failurePoint === 'generate' ? handleMetaDescriptionGenerate : handleMetaDescriptionRegenerate,
		retryCtaLabel: failurePoint === 'generate' ? tryAgainLabel : regenerateLabel,
		onStart: handleMetaDescriptionGenerate,
		value,
		setValue,
		includeInResults: true,
		hasSelection: !! selectedMetaDescription,
		hasFailed,
		resetState,
	};
};
