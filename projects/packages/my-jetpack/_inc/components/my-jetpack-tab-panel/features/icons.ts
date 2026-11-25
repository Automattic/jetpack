import {
	audio,
	backup,
	chartBar,
	comment,
	currencyDollar,
	envelope,
	formatListBullets,
	listView,
	megaphone,
	people,
	search,
	share,
	shield,
	starFilled,
	trendingUp,
	video,
} from '@wordpress/icons';
import { seo } from './seo-icon';
import type { ReactElement } from 'react';

/**
 * Maps the `icon` key each feature carries in the PHP catalog onto a real icon.
 *
 * The catalog is meant to move to a WordPress.com endpoint, which can only send a
 * string, so the string-to-component step has to live here.
 */
const featureIcons: Record< string, ReactElement > = {
	audio,
	backup,
	'chart-bar': chartBar,
	comment,
	'currency-dollar': currencyDollar,
	envelope,
	'list-bullets': formatListBullets,
	list: listView,
	megaphone,
	people,
	search,
	seo,
	share,
	shield,
	star: starFilled,
	'trending-up': trendingUp,
	video,
};

export const getFeatureIcon = ( icon: string ) => featureIcons[ icon ] ?? listView;
