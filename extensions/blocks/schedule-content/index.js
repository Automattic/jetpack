/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, Path } from '@wordpress/components';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import renderMaterialIcon from '../../shared/render-material-icon';
import ScheduleContentBlock from './edit';
import { supportsCollections } from '../../shared/block-category';

/**
 * Style dependencies
 */
import './editor.scss';

const save = () => (
	<div>
		<InnerBlocks.Content />
	</div>
);

export const name = 'schedule-content';
export const title = __( 'Schedule Content', 'jetpack' );
export const settings = {
	title,

	description: __(
		'Allow content within your post to appear or disappear at a certain time.',
		'jetpack'
	),

	icon: renderMaterialIcon(
		<Path d="M12.5 8H11v6l4.75 2.85.75-1.23-4-2.37zm4.837-6.19l4.607 3.845-1.28 1.535-4.61-3.843zm-10.674 0l1.282 1.536L3.337 7.19l-1.28-1.536zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" />
	),

	category: supportsCollections() ? 'widgets' : 'jetpack',

	keywords: [ __( 'timer', 'jetpack' ), __( 'wait', 'jetpack' ), __( 'revisions', 'jetpack' ) ],
	attributes: {
		date: {
			type: 'number',
			default: new Date(),
		},
		radioOption: {
			type: 'string',
			default: 'displayBlock',
		},
		hasScheduledBlock: {
			type: 'boolean',
			default: false,
		},
	},

	supports: {
		align: false,
		alignWide: true,
		anchor: false,
		customClassName: true,
		className: true,
		html: false,
		multiple: true,
		reusable: true,
	},

	edit: props => <ScheduleContentBlock { ...props } />,

	save,
};
