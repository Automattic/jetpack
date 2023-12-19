import { __ } from '@wordpress/i18n';
export const isaGroupLabels = {
	all: __( 'All', 'jetpack-boost' ),
	core_front_page: __( 'Homepage', 'jetpack-boost' ),
	singular_page: __( 'Pages', 'jetpack-boost' ),
	singular_post: __( 'Posts', 'jetpack-boost' ),
	other: __( 'Other', 'jetpack-boost' ),
	fixed: __( 'Fixed Images', 'jetpack-boost' ),
} as const;

export type isGroupLabels = keyof typeof isaGroupLabels;

export function getGroupLabel( group: isGroupLabels ) {
	if ( ! isaGroupLabels[ group ] ) {
		return group;
	}
	return isaGroupLabels[ group ];
}
