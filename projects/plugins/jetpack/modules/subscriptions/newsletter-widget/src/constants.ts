import { __ } from '@wordpress/i18n';

export const SERIES_COLORS = {
	all: '#3057dc',
	paid: '#e68b28',
};

export const SERIES_LABELS = {
	all: __( 'All', 'jetpack' ),
	paid: __( 'Paid', 'jetpack' ),
};

export const TRACKS_EVENT_NAME_PREFIX = 'jetpack_newsletter_widget_';

// Shared by the y scale's nice() and the left axis, so the rounded top of the scale always gets a label.
export const Y_TICK_COUNT = 5;
