import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import TypingMessage from './typing-message';
import type { Step, Option } from './types';

export const useMetaDescriptionStep = ( {
	addMessage,
	removeLastMessage,
	onStep,
	setIsBusy,
} ): Step => {
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< Option[] >( [] );
	const { editPost } = useDispatch( 'core/editor' );
	const [ completed, setCompleted ] = useState( false );

	const handleMetaDescriptionSelect = useCallback( ( option: Option ) => {
		setSelectedMetaDescription( option.content );
		setMetaDescriptionOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

	const handleMetaDescriptionSubmit = useCallback( async () => {
		addMessage( { content: <TypingMessage /> } );
		await editPost( { meta: { advanced_seo_description: selectedMetaDescription } } );
		removeLastMessage();
		addMessage( { content: selectedMetaDescription, isUser: true } );
		addMessage( { content: __( 'Meta description updated! ✅', 'jetpack' ) } );
		setCompleted( true );
		if ( onStep ) {
			onStep( { value: selectedMetaDescription } );
		}
	}, [ selectedMetaDescription, onStep, addMessage, editPost, removeLastMessage ] );

	const handleMetaDescriptionGenerate = useCallback( async () => {
		setIsBusy( true );
		let newMetaDescriptions;
		// we only generate if options are empty
		if ( metaDescriptionOptions.length === 0 ) {
			addMessage( { content: <TypingMessage /> } );
			newMetaDescriptions = await new Promise( resolve =>
				setTimeout(
					() =>
						resolve( [
							{
								id: 'meta-1',
								content:
									'Explore breathtaking flower and plant photography in our Flora Guide, featuring tips and inspiration for gardening and plant enthusiasts to enhance their outdoor spaces.',
							},
						] ),
					2000
				)
			);
			removeLastMessage();
		}
		addMessage( { content: __( "Here's a suggestion:", 'jetpack' ) } );
		setMetaDescriptionOptions( newMetaDescriptions || metaDescriptionOptions );
		setIsBusy( false );
	}, [ metaDescriptionOptions, addMessage, removeLastMessage, setIsBusy ] );

	const handleMetaDescriptionRegenerate = useCallback( async () => {
		setMetaDescriptionOptions( [] );
		addMessage( { content: <TypingMessage /> } );
		const newMetaDescription = await new Promise< Array< Option > >( resolve =>
			setTimeout(
				() =>
					resolve( [
						{
							id: 'meta-1',
							content:
								'Explore breathtaking flower and plant photography in our Flora Guide, featuring tips and inspiration for gardening and plant enthusiasts to enhance their outdoor spaces.',
						},
					] ),
				2000
			)
		);
		removeLastMessage();
		addMessage( { content: __( "Here's a new suggestion:", 'jetpack' ) } );
		setMetaDescriptionOptions( newMetaDescription );
	}, [ addMessage, removeLastMessage ] );

	const handleSkip = useCallback( () => {
		addMessage( { content: __( 'Skipped!', 'jetpack' ) } );
		if ( onStep ) {
			onStep();
		}
	}, [ addMessage, onStep ] );

	return {
		id: 'meta',
		title: __( 'Add meta description', 'jetpack' ),
		messages: [
			{
				content: __( "Now, let's optimize your meta description.", 'jetpack' ),
				showIcon: true,
			},
		],
		type: 'options',
		options: metaDescriptionOptions,
		onSelect: handleMetaDescriptionSelect,
		onSubmit: handleMetaDescriptionSubmit,
		submitCtaLabel: __( 'Insert', 'jetpack' ),
		onRetry: handleMetaDescriptionRegenerate,
		onRetryCtaLabel: __( 'Regenerate', 'jetpack' ),
		onStart: handleMetaDescriptionGenerate,
		onSkip: handleSkip,
		value: selectedMetaDescription,
		setValue: setSelectedMetaDescription,
		completed,
		setCompleted,
	};
};
