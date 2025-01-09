import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TypingMessage } from './index';
import type { Step, Option } from './index';

export const useMetaDescriptionStep = ( {
	addMessage,
	removeLastMessage,
	onStep,
} ): {
	stepProps: Step;
	value: string;
	setValue: React.Dispatch< React.SetStateAction< string > >;
} => {
	// const [ selectedTitle, setSelectedTitle ] = useState< string >();
	// const [ titleOptions, setTitleOptions ] = useState< Option[] >( [] );
	const [ selectedMetaDescription, setSelectedMetaDescription ] = useState< string >();
	const [ metaDescriptionOptions, setMetaDescriptionOptions ] = useState< Option[] >( [] );

	const handleMetaDescriptionSelect = useCallback( ( option: Option ) => {
		setSelectedMetaDescription( option.content );
		setMetaDescriptionOptions( prev =>
			prev.map( opt => ( {
				...opt,
				selected: opt.id === option.id,
			} ) )
		);
	}, [] );

	const handleMetaDescriptionSubmit = useCallback( () => {
		addMessage( { content: selectedMetaDescription, isUser: true } );
		addMessage( __( 'Meta description updated! ✅', 'jetpack' ) );
		if ( onStep ) {
			onStep( { value: selectedMetaDescription } );
		}
	}, [ selectedMetaDescription, onStep, addMessage ] );

	const handleMetaDescriptionGenerate = useCallback( async () => {
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
		addMessage( "Here's a suggestion:" );
		setMetaDescriptionOptions( newMetaDescriptions || metaDescriptionOptions );
	}, [ metaDescriptionOptions, addMessage, removeLastMessage ] );

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
		addMessage( "Here's a new suggestion:" );
		setMetaDescriptionOptions( newMetaDescription );
	}, [ addMessage, removeLastMessage ] );

	return {
		stepProps: {
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
		},
		value: selectedMetaDescription,
		setValue: setSelectedMetaDescription,
	};
};
