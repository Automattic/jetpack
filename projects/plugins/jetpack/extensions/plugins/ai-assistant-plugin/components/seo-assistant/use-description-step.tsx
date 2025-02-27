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

const mockDescriptionRequest = ( keywords: string ) => {
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

export const useDescriptionStep = ( {
	keywords,
	mockRequests = false,
}: {
	keywords: string;
	mockRequests?: boolean;
} ): Step => {
	const [ value, setValue ] = useState< string >();
	const [ lastValue, setLastValue ] = useState< string >( '' );
	const [ selectedDescription, setSelectedDescription ] = useState< string >();
	const [ valueOptions, setValueOptions ] = useState< OptionMessage[] >( [] );
	const { getMessages, setMessages, addMessage, editLastMessage, setSelectedMessage } =
		useMessages();
	const { editPost } = useDispatch( editorStore );
	const { getPostContent } = usePostContent();
	const postContent = getPostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const [ generatedCount, setGeneratedCount ] = useState( 0 );
	const [ hasFailed, setHasFailed ] = useState( false );
	const [ failurePoint, setFailurePoint ] = useState< 'generate' | 'regenerate' | null >( null );
	const { tracks } = useAnalytics();
	const messages = getMessages();
	const prevStepHasChanged = useMemo( () => keywords !== lastValue, [ keywords, lastValue ] );
	const stepId = 'description';

	const request = useCallback( async () => {
		if ( mockRequests ) {
			return mockDescriptionRequest( keywords );
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

	const handleDescriptionSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedDescription( option.content as string );
			setSelectedMessage( option );
			setValueOptions( prev => prev.map( o => ( { ...o, selected: o.id === option.id } ) ) );
		},
		[ setSelectedMessage ]
	);

	const getDescriptions = useCallback( async () => {
		const response = await request();
		const parsedResponse: { descriptions: string[] } = JSON.parse( response );
		const count = parsedResponse.descriptions?.length;
		const newDescriptions = parsedResponse.descriptions.map( ( description, index ) => ( {
			id: `description-${ generatedCount + count + index }`,
			content: description,
		} ) );

		setGeneratedCount( current => current + count );

		return newDescriptions;
	}, [ generatedCount, request ] );

	const handleDescriptionSubmit = useCallback( async () => {
		setValue( selectedDescription );
		await editPost( { meta: { advanced_seo_description: selectedDescription } } );
		addMessage( { content: __( 'Description updated! ✅', 'jetpack' ) } );

		return selectedDescription;
	}, [ selectedDescription, addMessage, editPost ] );

	useEffect( () => {
		if ( ! hasFailed ) {
			// Reset the failure point when the request is successful
			setFailurePoint( null );
		}
	}, [ hasFailed ] );

	const handleDescriptionGenerate = useCallback(
		async ( { fromSkip } ) => {
			let newDescriptions = [ ...valueOptions ];
			const previousLastValue = lastValue;

			setLastValue( keywords );

			if ( ! hasFailed ) {
				const initialMessage = fromSkip
					? {
							content: createInterpolateElement(
								__( "Skipped!<br />Now, let's optimize your description.", 'jetpack' ),
								{ br: <br /> }
							),
							showIcon: true,
					  }
					: {
							content: __( "Now, let's optimize your description.", 'jetpack' ),
							showIcon: true,
					  };

				setMessages( [ initialMessage ] );
			}

			// we only generate if options are empty
			if ( newDescriptions.length === 0 || prevStepHasChanged ) {
				try {
					setSelectedDescription( '' );
					setHasFailed( false );
					newDescriptions = await getDescriptions();
				} catch {
					setFailurePoint( 'generate' );
					setHasFailed( true );
					// reset the last value to the previous value on failure to avoid a wrong value for prevStepHasChanged
					setLastValue( previousLastValue );

					return;
				}
			}

			setValueOptions( newDescriptions );

			const readyMessageSuffix = createInterpolateElement(
				__( "<br />Here's a suggestion:", 'jetpack' ),
				{ br: <br /> }
			);

			editLastMessage( readyMessageSuffix, true );

			newDescriptions.forEach( description =>
				addMessage( { ...description, type: 'option', isUser: true } )
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
			getDescriptions,
			addMessage,
		]
	);

	const handleDescriptionRegenerate = useCallback( async () => {
		try {
			setHasFailed( false );
			const newDescription = await getDescriptions();

			setValueOptions( prev => [ ...prev, ...newDescription ] );
			newDescription.forEach( description =>
				addMessage( { ...description, type: 'option', isUser: true } )
			);
		} catch {
			setFailurePoint( 'regenerate' );
			setHasFailed( true );
		}
	}, [ addMessage, getDescriptions ] );

	const resetState = useCallback( () => {
		setHasFailed( false );
		setFailurePoint( null );
	}, [] );

	// The build fails if we use i18n strings directly in a ternary operator.
	const tryAgainLabel = __( 'Try again', 'jetpack' );
	const regenerateLabel = __( 'Regenerate', 'jetpack' );

	return {
		id: stepId,
		title: __( 'Add SEO Description', 'jetpack' ),
		label: __( 'SEO Description', 'jetpack' ),
		messages: messages,
		type: 'options',
		options: valueOptions,
		onSelect: handleDescriptionSelect,
		onSubmit: handleDescriptionSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: failurePoint === 'generate' ? handleDescriptionGenerate : handleDescriptionRegenerate,
		retryCtaLabel: failurePoint === 'generate' ? tryAgainLabel : regenerateLabel,
		onStart: handleDescriptionGenerate,
		value,
		setValue,
		includeInResults: true,
		hasSelection: !! selectedDescription,
		hasFailed,
		resetState,
	};
};
