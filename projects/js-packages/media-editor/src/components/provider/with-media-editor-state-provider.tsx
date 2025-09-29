/**
 * WordPress dependencies
 */
import { useState, createContext, useContext, useMemo, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { type AspectRatio } from '../media-renderer/image/editing-tools/aspect-ratio';

export interface AiVariant {
	id: string;
	attachmentId?: number;
	url: string;
	altText?: string;
	summary?: string;
	isNewImage?: boolean;
	createdAt: number;
	status: 'pending' | 'accepted' | 'discarded';
}

/*
	This provider is used to manage the state of the media editor,
	until there's cause for a fully-fledged store/state management solution.
*/

export interface MediaEditorStateContextValue {
	isImageEditorOpen: boolean;
	setIsImageEditorOpen: ( isImageEditorOpen: boolean ) => void;
	isEditInProgress: boolean;
	setIsEditInProgress: ( isSaveInProgress: boolean ) => void;
	selectedAspectRatio: AspectRatio | null;
	setSelectedAspectRatio: ( selectedAspectRatio: AspectRatio | null ) => void;
	aiEditedImageUrl: string | null;
	setAiEditedImageUrl: ( url: string | null ) => void;
	isAiProcessing: boolean;
	setIsAiProcessing: ( isProcessing: boolean ) => void;
	aiEditHistory: Array< {
		id: string;
		prompt: string;
		imageUrl: string;
		timestamp: number;
		attachmentId?: number;
	} >;
	addToAiEditHistory: ( edit: {
		id: string;
		prompt: string;
		imageUrl: string;
		attachmentId?: number;
	} ) => void;
	clearAiEditHistory: () => void;
	aiVariants: AiVariant[];
	addAiVariant: ( variant: {
		id?: string;
		attachmentId?: number;
		url: string;
		altText?: string;
		summary?: string;
		isNewImage?: boolean;
	} ) => string;
	acceptAiVariant: ( id: string ) => void;
	discardAiVariant: ( id: string ) => void;
	clearAiVariants: () => void;
	activeAiVariantId: string | null;
	setActiveAiVariantId: ( id: string | null ) => void;
}

const MediaEditorStateContext = createContext< MediaEditorStateContextValue >( {
	isImageEditorOpen: false,
	setIsImageEditorOpen: () => {},
	setIsEditInProgress: () => {},
	isEditInProgress: false,
	selectedAspectRatio: null,
	setSelectedAspectRatio: () => {},
	aiEditedImageUrl: null,
	setAiEditedImageUrl: () => {},
	isAiProcessing: false,
	setIsAiProcessing: () => {},
	aiEditHistory: [],
	addToAiEditHistory: () => {},
	clearAiEditHistory: () => {},
	aiVariants: [],
	addAiVariant: () => '',
	acceptAiVariant: () => {},
	discardAiVariant: () => {},
	clearAiVariants: () => {},
	activeAiVariantId: null,
	setActiveAiVariantId: () => {},
} );

const withMediaEditorStateProvider = createHigherOrderComponent( WrappedComponent => {
	const Component = ( { ...props } ) => {
		const [ isImageEditorOpen, setIsImageEditorOpen ] = useState( false );
		const [ isEditInProgress, setIsEditInProgress ] = useState< boolean >( false );
		const [ selectedAspectRatio, setSelectedAspectRatio ] = useState< AspectRatio | null >( null );
		const [ aiEditedImageUrl, setAiEditedImageUrl ] = useState< string | null >( null );
		const [ isAiProcessing, setIsAiProcessing ] = useState< boolean >( false );
		const [ aiEditHistory, setAiEditHistory ] = useState<
			Array< {
				id: string;
				prompt: string;
				imageUrl: string;
				timestamp: number;
				attachmentId?: number;
			} >
		>( [] );
		const [ aiVariants, setAiVariants ] = useState< AiVariant[] >( [] );
		const [ activeAiVariantId, setActiveAiVariantId ] = useState< string | null >( null );

		// AI edit history functions
		const addToAiEditHistory = useCallback(
			( edit: { id: string; prompt: string; imageUrl: string; attachmentId?: number } ) => {
				setAiEditHistory( prev => [
					...prev,
					{
						...edit,
						timestamp: Date.now(),
					},
				] );
			},
			[]
		);

		const clearAiEditHistory = useCallback( () => {
			setAiEditHistory( [] );
		}, [] );

		const addAiVariant = useCallback(
			( variant: {
				id?: string;
				attachmentId?: number;
				url: string;
				altText?: string;
				summary?: string;
				isNewImage?: boolean;
			} ) => {
				const generatedId = variant.id ?? `ai-variant-${ Date.now() }-${ Math.random() }`;
				setAiVariants( prev => {
					const existingIndex = prev.findIndex( item => item.id === generatedId );
					const nextVariant: AiVariant = {
						id: generatedId,
						attachmentId: variant.attachmentId,
						url: variant.url,
						altText: variant.altText,
						summary: variant.summary,
						isNewImage: variant.isNewImage,
						createdAt: Date.now(),
						status: 'pending',
					};

					if ( existingIndex === -1 ) {
						return [ ...prev, nextVariant ];
					}

					const updated = [ ...prev ];
					updated[ existingIndex ] = {
						...prev[ existingIndex ],
						...nextVariant,
						status: 'pending',
					};
					return updated;
				} );
				setAiEditedImageUrl( variant.url );
				setActiveAiVariantId( generatedId );
				return generatedId;
			},
			[]
		);

		const acceptAiVariant = useCallback( ( id: string ) => {
			setAiVariants( prev =>
				prev.map( item => {
					if ( item.id !== id ) {
						return item;
					}
					return {
						...item,
						status: 'accepted',
					};
				} )
			);
			setActiveAiVariantId( currentId => ( currentId === id ? null : currentId ) );
		}, [] );

		const discardAiVariant = useCallback( ( id: string ) => {
			let removedVariantUrl: string | undefined;
			setAiVariants( prev => {
				const removed = prev.find( item => item.id === id );
				removedVariantUrl = removed?.url;
				return prev.filter( item => item.id !== id );
			} );
			setAiEditHistory( prev => prev.filter( entry => entry.id !== id ) );
			setActiveAiVariantId( currentId => ( currentId === id ? null : currentId ) );
			if ( removedVariantUrl ) {
				setAiEditedImageUrl( currentUrl =>
					currentUrl === removedVariantUrl ? null : currentUrl
				);
			}
		}, [] );

		const clearAiVariants = useCallback( () => {
			setAiVariants( [] );
			setActiveAiVariantId( null );
			setAiEditedImageUrl( null );
		}, [] );

		const contextValue = useMemo( () => {
			return {
				isImageEditorOpen,
				setIsImageEditorOpen,
				isEditInProgress,
				setIsEditInProgress,
				selectedAspectRatio,
				setSelectedAspectRatio,
				aiEditedImageUrl,
				setAiEditedImageUrl,
				isAiProcessing,
				setIsAiProcessing,
				aiEditHistory,
				addToAiEditHistory,
				clearAiEditHistory,
				aiVariants,
				addAiVariant,
				acceptAiVariant,
				discardAiVariant,
				clearAiVariants,
				activeAiVariantId,
				setActiveAiVariantId,
			};
		}, [
			isImageEditorOpen,
			setIsImageEditorOpen,
			isEditInProgress,
			setIsEditInProgress,
			selectedAspectRatio,
			setSelectedAspectRatio,
			aiEditedImageUrl,
			setAiEditedImageUrl,
			isAiProcessing,
			setIsAiProcessing,
			aiEditHistory,
			addToAiEditHistory,
			clearAiEditHistory,
			aiVariants,
			addAiVariant,
			acceptAiVariant,
			discardAiVariant,
			clearAiVariants,
			activeAiVariantId,
			setActiveAiVariantId,
		] );

		return (
			<MediaEditorStateContext.Provider value={ contextValue }>
				<WrappedComponent { ...props } />
			</MediaEditorStateContext.Provider>
		);
	};

	Component.displayName = `withMediaEditorStateProvider(${
		WrappedComponent.displayName || WrappedComponent.name || 'Component'
	})`;
	return Component;
}, 'withMediaEditorStateProvider' );

export default withMediaEditorStateProvider;

export const useMediaEditorState = () => {
	const context = useContext( MediaEditorStateContext );
	if ( ! context ) {
		throw new Error( 'Missing MediaEditorStateContext' );
	}
	return context;
};
