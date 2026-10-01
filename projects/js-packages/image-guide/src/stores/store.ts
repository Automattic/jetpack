import {
	createReduxStore,
	createSelector,
	dispatch,
	register,
	select,
	subscribe,
} from '@wordpress/data';
import { MeasurableImage, type Dimensions, type Weight } from '../MeasurableImage.ts';

const LS_KEY = 'jetpack-boost-guide';
const labels = { active: 'Active', paused: 'Paused' } as const;
export type GuideState = keyof typeof labels;
export type ImageFacts = {
	fileSize: Dimensions;
	fileWeight: Weight;
	sizeOnPage: Dimensions;
	url: string;
	loading: boolean;
};
type State = {
	guideState: GuideState;
	images: Record< string, ImageFacts >;
	imageChange: { id?: string; revision: number };
	// Same-object writes must still notify the temporary Svelte facade.
	revisions: Record< string, Partial< Record< keyof ImageFacts, number > > >;
};
const stored = localStorage.getItem( LS_KEY ) as GuideState;
const initialState: State = {
	guideState: stored && labels[ stored ] ? stored : 'active',
	images: {},
	imageChange: { revision: 0 },
	revisions: {},
};
const actions = {
	setGuideState: ( value: GuideState ) => ( { type: 'SET_GUIDE_STATE' as const, value } ),
	cycleGuideState: () => ( { type: 'CYCLE_GUIDE_STATE' as const } ),
	setImage: ( id: string, facts: ImageFacts ) => ( { type: 'SET_IMAGE' as const, id, facts } ),
	updateImage: ( id: string, facts: Partial< ImageFacts > ) => ( {
		type: 'UPDATE_IMAGE' as const,
		id,
		facts,
	} ),
};
type Action = ReturnType< ( typeof actions )[ keyof typeof actions ] >;

export const store = createReduxStore( 'jetpack/image-guide', {
	reducer( state = initialState, action: Action ): State {
		switch ( action.type ) {
			case 'SET_GUIDE_STATE':
				return { ...state, guideState: action.value };
			case 'CYCLE_GUIDE_STATE':
				return { ...state, guideState: state.guideState === 'active' ? 'paused' : 'active' };
			case 'SET_IMAGE':
				return {
					...state,
					images: { ...state.images, [ action.id ]: action.facts },
					imageChange: { id: action.id, revision: state.imageChange.revision + 1 },
				};
			case 'UPDATE_IMAGE': {
				const revisions = { ...state.revisions[ action.id ] };
				for ( const key of Object.keys( action.facts ) as ( keyof ImageFacts )[] ) {
					revisions[ key ] = ( revisions[ key ] || 0 ) + 1;
				}
				return {
					...state,
					imageChange: { id: action.id, revision: state.imageChange.revision + 1 },
					revisions: { ...state.revisions, [ action.id ]: revisions },
					images: {
						...state.images,
						[ action.id ]: { ...state.images[ action.id ], ...action.facts },
					},
				};
			}
			default:
				return state;
		}
	},
	actions,
	selectors: {
		getGuideState: ( state: State ) => state.guideState,
		getGuideLabel: ( state: State ) => labels[ state.guideState ],
		getImageFacts: ( state: State, id: string ) => state.images[ id ],
		getImageChange: ( state: State ) => state.imageChange,
		getImageRevision: ( state: State, id: string, key: keyof ImageFacts ) =>
			state.revisions[ id ]?.[ key ] || 0,
		getExpectedSize: createSelector(
			( state: State, id: string ) =>
				MeasurableImage.prototype.getExpectedSize( state.images[ id ].sizeOnPage ),
			( state: State, id: string ) => [
				state.images[ id ].sizeOnPage,
				state.revisions[ id ]?.sizeOnPage,
			]
		),
		getOversizedRatio: createSelector(
			( state: State, id: string ) => {
				const { fileSize, sizeOnPage } = state.images[ id ];
				return MeasurableImage.prototype.getOversizedRatio( fileSize, sizeOnPage );
			},
			( state: State, id: string ) => [ state.images[ id ], state.revisions[ id ] ]
		),
		getPotentialSavings: createSelector(
			( state: State, id: string ) => {
				const { fileSize, fileWeight, sizeOnPage } = state.images[ id ];
				return MeasurableImage.prototype.getPotentialSavings( fileSize, fileWeight, sizeOnPage );
			},
			( state: State, id: string ) => [ state.images[ id ], state.revisions[ id ] ]
		),
	},
} );

register( store );
export const selectors: {
	getGuideState: () => GuideState;
	getGuideLabel: () => string;
	getImageFacts: ( id: string ) => ImageFacts;
	getImageChange: () => State[ 'imageChange' ];
	getImageRevision: ( id: string, key: keyof ImageFacts ) => number;
	getExpectedSize: ( id: string ) => Dimensions;
	getOversizedRatio: ( id: string ) => number;
	getPotentialSavings: ( id: string ) => number | null;
} = select( store );
export const commands: {
	[ K in keyof typeof actions ]: ( ...args: Parameters< ( typeof actions )[ K ] > ) => unknown;
} = dispatch( store );

const guideListeners = new Set< () => void >();
const imageListeners = new Map< string, { facts: ImageFacts; listeners: Set< () => void > } >();
export function subscribeToFacts( listener: () => void, id?: string ) {
	if ( id === undefined ) {
		guideListeners.add( listener );
		return () => guideListeners.delete( listener );
	}
	let entry = imageListeners.get( id );
	if ( ! entry ) {
		entry = { facts: selectors.getImageFacts( id ), listeners: new Set() };
		imageListeners.set( id, entry );
	}
	entry.listeners.add( listener );
	return () => {
		entry.listeners.delete( listener );
		if ( ! entry.listeners.size ) imageListeners.delete( id );
	};
}

function notifyImage( id: string ) {
	const entry = imageListeners.get( id );
	const facts = selectors.getImageFacts( id );
	if ( entry && facts !== entry.facts ) {
		entry.facts = facts;
		entry.listeners.forEach( listener => listener() );
	}
}

let imageChange = selectors.getImageChange();
let persisted = selectors.getGuideState();
localStorage.setItem( LS_KEY, persisted );
subscribe( () => {
	const value = selectors.getGuideState();
	if ( value !== persisted ) {
		persisted = value;
		localStorage.setItem( LS_KEY, value );
		guideListeners.forEach( listener => listener() );
	}
	const change = selectors.getImageChange();
	if ( change !== imageChange ) {
		const batched = change.revision !== imageChange.revision + 1;
		imageChange = change;
		// Registry batches can change several images before one notification.
		if ( batched ) imageListeners.forEach( ( entry, id ) => notifyImage( id ) );
		else if ( change.id !== undefined ) notifyImage( change.id );
	}
}, store );
