/**
 * External dependencies
 */
import { dispatch, select as registrySelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	PREFERENCES_STORE,
	type PreferencesActions,
	type PreferencesSelectors,
} from './remembered-preset';

const SECTION_ORDER_KEY = 'sectionOrder';

const NO_ORDER: readonly string[] = [];

type Select = ( store: string ) => unknown;

/**
 * The order the reader gave a screen's tabs, as section slugs; empty when they gave none.
 *
 * @param scope  - The screen's preferences scope.
 * @param select - The registry's `select`; inside `useSelect`, the one it hands over.
 * @return The slugs, first tab first.
 */
export function getSectionOrder(
	scope: string,
	select: Select = registrySelect
): readonly string[] {
	const preferences = select( PREFERENCES_STORE ) as PreferencesSelectors | undefined;
	const order = preferences?.get( scope, SECTION_ORDER_KEY );

	return Array.isArray( order ) && order.every( slug => typeof slug === 'string' )
		? order
		: NO_ORDER;
}

/**
 * Store the order the reader gave a screen's tabs; none goes back to the default order.
 *
 * @param scope - The screen's preferences scope.
 * @param order - The section slugs, first tab first.
 */
export function setSectionOrder( scope: string, order?: readonly string[] ): void {
	( dispatch( PREFERENCES_STORE ) as PreferencesActions | undefined )?.set(
		scope,
		SECTION_ORDER_KEY,
		order
	);
}

/**
 * The sections in the reader's order: the ones it names first, the rest after them as given.
 * A slug it names with no section is skipped, not dropped, so the section returns to its place.
 *
 * @param sections - The available sections, in their default order.
 * @param order    - The reader's order, as section slugs.
 * @return The ordered sections; `sections` itself when the reader gave no order.
 */
export function orderSections< T extends { slug: string } >(
	sections: T[],
	order: readonly string[]
): T[] {
	if ( order.length === 0 ) {
		return sections;
	}

	const rank = ( { slug }: T ) => {
		const index = order.indexOf( slug );

		return index === -1 ? order.length : index;
	};

	return [ ...sections ].sort( ( a, b ) => rank( a ) - rank( b ) );
}
