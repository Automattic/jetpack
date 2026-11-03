/**
 * External dependencies
 */
import {
	backup,
	bug,
	calendar,
	category,
	chartBar,
	comment,
	desktop,
	download,
	envelope,
	globe,
	link,
	mapMarker,
	megaphone,
	mobile,
	page,
	pages,
	payment,
	people,
	percent,
	post,
	postAuthor,
	postList,
	receipt,
	scheduled,
	search,
	seen,
	share,
	starEmpty,
	store,
	trendingUp,
	verse,
	video,
	wordpress,
} from '@wordpress/icons';
/**
 * Internal dependencies
 */
import {
	channel,
	chartLine,
	coupon,
	customer,
	device,
	goal,
	jetpack,
	location,
	paymentReturn,
	productBlouse,
	reports,
	tag,
} from './library';
import type { ReactElement } from 'react';

const COLLECTION = 'jpa';

/**
 * What a widget may name as `jpa/<name>`: the WordPress glyphs the widgets use, and the
 * dashboard's own where no widget names a WordPress one. Explicit, so a consumer bundles only
 * these; `calendar`, `megaphone`, `payment` and `search` are the WordPress glyphs here, and the
 * dashboard's own stay reachable by import.
 */
const ICONS: Record< string, ReactElement > = {
	backup,
	bug,
	calendar,
	category,
	'chart-bar': chartBar,
	comment,
	desktop,
	download,
	envelope,
	globe,
	link,
	'map-marker': mapMarker,
	megaphone,
	mobile,
	page,
	pages,
	payment,
	people,
	percent,
	post,
	'post-author': postAuthor,
	'post-list': postList,
	receipt,
	scheduled,
	search,
	seen,
	share,
	'star-empty': starEmpty,
	store,
	'trending-up': trendingUp,
	verse,
	video,
	wordpress,
	channel,
	'chart-line': chartLine,
	coupon,
	customer,
	device,
	goal,
	jetpack,
	location,
	'payment-return': paymentReturn,
	'product-blouse': productBlouse,
	reports,
	tag,
};

/**
 * Looks a `jpa/<name>` reference up in the collection. Anything else is `null`.
 *
 * @param reference - The icon name a widget record carries.
 * @return The icon element, or `null` when the name matches nothing.
 */
export function lookupWidgetIcon( reference: string ): ReactElement | null {
	const prefix = `${ COLLECTION }/`;
	if ( ! reference.startsWith( prefix ) ) {
		return null;
	}

	const name = reference.slice( prefix.length );
	return Object.prototype.hasOwnProperty.call( ICONS, name ) ? ICONS[ name ] : null;
}

/**
 * The lookup in the shape `registerIconResolver()` takes.
 *
 * @param reference - The icon name a widget record carries.
 * @return The icon element, or `null` when the name matches nothing.
 */
export async function resolveWidgetIcon( reference: string ): Promise< ReactElement | null > {
	return lookupWidgetIcon( reference );
}
