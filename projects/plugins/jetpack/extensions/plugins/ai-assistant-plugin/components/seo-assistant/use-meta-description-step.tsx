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
	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< OptionMessage[] >( [] );
	const { messages, setMessages, addMessage, editLastMessage, setSelectedMessage } = useMessages();
	const { editPost } = useDispatch( editorStore );
	const postContent = usePostContent();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const [ generatedCount, setGeneratedCount ] = useState( 0 );

	const prevStepHasChanged = useMemo( () => keywords !== lastValue, [ keywords, lastValue ] );

	const request = useCallback( async () => {
		if ( mockRequests ) {
			return mockMetaDescriptionRequest( keywords );
		}
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
				feature: 'seo-meta-description',
			}
		);
	}, [ keywords, postContent, postId, mockRequests ] );

	const handleMetaDescriptionSelect = useCallback(
		( option: OptionMessage ) => {
			setSelectedMetaDescription( option.content as string );
			setSelectedMessage( option );
			setMetaDescriptionOptions( prev =>
				prev.map( o => ( { ...o, selected: o.id === option.id } ) )
			);
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

	const handleMetaDescriptionGenerate = useCallback(
		async ( { fromSkip } ) => {
			let newMetaDescriptions = [ ...metaDescriptionOptions ];

			setLastValue( keywords );
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
			// we only generate if options are empty
			if ( newMetaDescriptions.length === 0 || prevStepHasChanged ) {
				setSelectedMetaDescription( '' );
				newMetaDescriptions = await getMetaDescriptions();
			}
			setMetaDescriptionOptions( newMetaDescriptions );
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
			metaDescriptionOptions,
			setMessages,
			editLastMessage,
			getMetaDescriptions,
			addMessage,
			keywords,
			prevStepHasChanged,
		]
	);

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		const newMetaDescription = await getMetaDescriptions();

		setMetaDescriptionOptions( prev => [ ...prev, ...newMetaDescription ] );
		newMetaDescription.forEach( meta => addMessage( { ...meta, type: 'option', isUser: true } ) );
	}, [ addMessage, getMetaDescriptions ] );

	return {
		id: 'meta',
		title: __( 'Add meta description', 'jetpack' ),
		label: __( 'Meta description', 'jetpack' ),
		messages: messages,
		type: 'options',
		options: metaDescriptionOptions,
		onSelect: handleMetaDescriptionSelect,
		onSubmit: handleMetaDescriptionSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: handleMetaDescriptionRegenerate,
		retryCtaLabel: __( 'Regenerate', 'jetpack' ),
		onStart: handleMetaDescriptionGenerate,
		value,
		setValue,
		includeInResults: true,
		hasSelection: !! selectedMetaDescription,
	};
};
