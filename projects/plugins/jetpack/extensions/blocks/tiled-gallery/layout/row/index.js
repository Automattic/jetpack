/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

export const name = 'row';

export const settings = {
	title: 'Tiled Gallery Row',
	description: 'Tiled Gallery row component',
	keywords: [],
	category: '',
	edit,
	save,
	parent: [ 'jetpack/tiled-gallery' ],
};
