/**
 * External dependencies
 */
import { map, includes } from 'lodash';
import { getCategories, setCategories } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import JetpackLogo from '../shared/jetpack-logo';

/**
 * Add custom categories, checking that the new category
 * doesn't already exist.
 */
const categories = getCategories();
const customCategories = [
	{
		slug: 'jetpack',
		title: 'Jetpack',
		icon: <JetpackLogo />,
	},
	{
		slug: 'earn',
		title: 'Earn',
	},
	{
		slug: 'marketing',
		title: 'Marketing',
	},
	{
		slug: 'social',
		title: 'Social',
	},
	{
		slug: 'widget',
		title: 'Widget',
	},
];

setCategories( [
	...categories,
	...customCategories.filter( ( { slug } ) => ! includes( map( categories, 'slug' ), slug ) ),
] );
