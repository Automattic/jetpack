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
	// Same-object writes must still notify the temporary Svelte facade.
	revisions: Record< string, Partial< Record< keyof ImageFacts, number > > >;
};
const stored = localStorage.getItem( LS_KEY ) as GuideState;
const initialState: State = {
	guideState: stored && labels[ stored ] ? stored : 'active',
	images: {},
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
				return { ...state, images: { ...state.images, [ action.id ]: action.facts } };
			case 'UPDATE_IMAGE': {
				const revisions = { ...state.revisions[ action.id ] };
				for ( const key of Object.keys( action.facts ) as ( keyof ImageFacts )[] ) {
					revisions[ key ] = ( revisions[ key ] || 0 ) + 1;
				}
				return {
					...state,
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
		getOversizedRatio: ( state: State, id: string ) => {
			const { fileSize, sizeOnPage } = state.images[ id ];
			return MeasurableImage.prototype.getOversizedRatio( fileSize, sizeOnPage );
		},
		getPotentialSavings: ( state: State, id: string ) => {
			const { fileSize, fileWeight, sizeOnPage } = state.images[ id ];
			return MeasurableImage.prototype.getPotentialSavings( fileSize, fileWeight, sizeOnPage );
		},
		hasItemsWithFileSize: ( state: State, ids: string[] ) =>
			ids.some( id => {
				const { fileSize } = state.images[ id ];
				return fileSize.width !== -1 && fileSize.height !== -1;
			} ),
	},
} );

register( store );
export const selectors: {
	getGuideState: () => GuideState;
	getGuideLabel: () => string;
	getImageFacts: ( id: string ) => ImageFacts;
	getImageRevision: ( id: string, key: keyof ImageFacts ) => number;
	getExpectedSize: ( id: string ) => Dimensions;
	getOversizedRatio: ( id: string ) => number;
	getPotentialSavings: ( id: string ) => number | null;
	hasItemsWithFileSize: ( ids: string[] ) => boolean;
} = select( store );
export const commands: {
	[ K in keyof typeof actions ]: ( ...args: Parameters< ( typeof actions )[ K ] > ) => unknown;
} = dispatch( store );

let persisted = selectors.getGuideState();
localStorage.setItem( LS_KEY, persisted );
subscribe( () => {
	const value = selectors.getGuideState();
	if ( value !== persisted ) {
		persisted = value;
		localStorage.setItem( LS_KEY, value );
	}
}, store );
