import { __ } from '@wordpress/i18n';
import { TimelineIcon } from '../icon';
import edit, { DEFAULT_BACKGROUND } from './edit';
import save from './save';

export const name = 'timeline-item';

export const settings = {
	title: __( 'Timeline Entry', 'jetpack' ),
	description: __( 'An entry on the timeline', 'jetpack' ),
	icon: TimelineIcon,
	category: 'widgets',
	parent: [ 'jetpack/timeline' ],
	attributes: {
		alignment: {
			type: 'string',
			default: 'auto',
		},
		background: {
			type: 'string',
			default: DEFAULT_BACKGROUND,
		},
	},
	edit,
	save,
};
