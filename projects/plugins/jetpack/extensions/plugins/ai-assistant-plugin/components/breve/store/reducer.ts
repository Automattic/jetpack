/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import features from '../features';
/**
 * Types
 */
import type { Anchor, BreveState } from '../types';

const enabledFromLocalStorage = window.localStorage.getItem( 'jetpack-ai-breve-enabled' );
const disabledFeaturesFromLocalStorage = window.localStorage.getItem(
	'jetpack-ai-breve-disabled-features'
);
const initialConfiguration = {
	enabled: enabledFromLocalStorage === 'true',
	disabled:
		disabledFeaturesFromLocalStorage !== null
			? JSON.parse( disabledFeaturesFromLocalStorage )
			: features
					.filter( feature => ! feature.config.defaultEnabled )
					.map( feature => feature.config.name ),
};

export function configuration(
	state: BreveState[ 'configuration' ] = initialConfiguration,
	action: { type: string; enabled?: boolean; feature?: string; loading?: boolean }
) {
	switch ( action.type ) {
		case 'SET_PROOFREAD_ENABLED': {
			const enabled = action?.enabled !== undefined ? action?.enabled : ! state?.enabled;
			window.localStorage.setItem( 'jetpack-ai-breve-enabled', String( enabled ) );

			return {
				...state,
				enabled,
			};
		}

		case 'ENABLE_FEATURE': {
			const disabled = ( state.disabled ?? [] ).filter( feature => feature !== action.feature );
			window.localStorage.setItem(
				'jetpack-ai-breve-disabled-features',
				JSON.stringify( disabled )
			);

			return {
				...state,
				disabled,
			};
		}

		case 'DISABLE_FEATURE': {
			const disabled = [ ...( state.disabled ?? [] ), action.feature ];
			window.localStorage.setItem(
				'jetpack-ai-breve-disabled-features',
				JSON.stringify( disabled )
			);

			return {
				...state,
				disabled,
			};
		}

		case 'SET_DICTIONARY_LOADING': {
			const loading = action.loading
				? [ ...( state.loading ?? [] ), action.feature ]
				: [ ...( state.loading ?? [] ) ].filter( feature => feature !== action.feature );

			return {
				...state,
				loading,
			};
		}

		case 'RELOAD_DICTIONARY': {
			return {
				...state,
				reload: ! state.reload,
			};
		}
	}

	return state;
}

const HIGHLIGHT_HOVERED_CLASS = 'jetpack-ai-breve__highlight-hovered';

export function popover(
	state: BreveState[ 'popover' ] = {},
	action: { type: string; isHover?: boolean; anchor?: Anchor }
) {
	const removeHoveredClass = () => {
		state?.anchor?.target?.classList?.remove( HIGHLIGHT_HOVERED_CLASS );
	};

	switch ( action.type ) {
		case 'SET_HIGHLIGHT_HOVER':
			if ( ! state?.isPopoverHover && ! action?.isHover ) {
				removeHoveredClass();
			}

			return {
				...state,
				isHighlightHover: action.isHover,
			};

		case 'SET_POPOVER_HOVER':
			if ( ! state?.isHighlightHover && ! action?.isHover ) {
				removeHoveredClass();
			}

			return {
				...state,
				isPopoverHover: action.isHover,
			};

		case 'SET_POPOVER_ANCHOR': {
			if ( ! action.anchor ) {
				return state;
			}

			const current = state?.anchor?.target;
			const next = action?.anchor?.target;

			// Handle fast change of anchor
			if ( current !== next ) {
				removeHoveredClass();
			}

			next?.classList?.add( HIGHLIGHT_HOVERED_CLASS );

			return {
				...state,
				anchor: action.anchor,
			};
		}
	}

	return state;
}

export function suggestions(
	state = {},
	action: {
		type: string;
		id: string;
		feature?: string;
		blockId: string;
		loading: boolean;
		md5?: string;
		suggestions?: {
			revisedText: string;
			suggestion: string;
		};
	}
) {
	const { id, feature, blockId } = action ?? {};
	const current = { ...state };
	const currentBlock = current?.[ blockId ] ?? {};
	const currentItem = current?.[ blockId ]?.[ feature ]?.[ id ] || {};

	switch ( action.type ) {
		case 'SET_SUGGESTIONS_LOADING': {
			return {
				...current,
				[ blockId ]: {
					...currentBlock,
					[ feature ]: {
						...( currentBlock[ feature ] ?? {} ),
						[ id ]: {
							...currentItem,
							loading: action.loading,
						},
					},
				},
			};
		}

		case 'SET_SUGGESTIONS': {
			return {
				...current,
				[ blockId ]: {
					...currentBlock,
					[ feature ]: {
						...( currentBlock[ feature ] ?? {} ),
						[ id ]: {
							...currentItem,
							loading: false,
							suggestions: action.suggestions,
						},
					},
				},
			};
		}

		case 'SET_BLOCK_MD5': {
			return {
				...current,
				[ blockId ]: {
					md5: action.md5,
					...currentBlock,
				},
			};
		}

		case 'INVALIDATE_SUGGESTIONS': {
			return {
				...current,
				[ blockId ]: {},
			};
		}

		case 'INVALIDATE_SINGLE_SUGGESTION': {
			return {
				...current,
				[ blockId ]: {
					...currentBlock,
					[ feature ]: {
						...( currentBlock[ feature ] ?? {} ),
						[ id ]: {},
					},
				},
			};
		}

		case 'IGNORE_SUGGESTION': {
			return {
				...current,
				[ blockId ]: {
					...currentBlock,
					ignored: [ ...( currentBlock.ignored ?? [] ), id ],
				},
			};
		}
	}

	return state;
}

export default combineReducers( { popover, configuration, suggestions } );
