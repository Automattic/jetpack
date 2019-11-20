/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'eventbrite';

// Should this be 'Eventbrite Tickets', since we may add other embeds in the future?
export const title = __( 'Eventbrite', 'jetpack' );

export const icon = null;

export const settings = {
	title,

	description: __( 'Embed Eventbrite event details and ticket checkout.', 'jetpack' ),

	// icon,

	category: 'jetpack',

	supports: {
		html: false,
	},

	attributes: {
		eventId: {
			type: 'string',
		},
		useModal: {
			type: 'boolean',
		},
	},

	edit,

	save: ( { attributes } ) => {
		const { eventId } = attributes;
		const html = `
			<noscript>
				<a href="https://www.eventbrite.com/e/${ eventId }" rel="noopener noreferrer" target="_blank">Buy Tickets on Eventbrite</a>
			</noscript>

			<script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
			<script type="text/javascript">
				window.EBWidgets.createWidget({
					widgetType: 'checkout',
					eventId: ${ eventId },
					modal: true,
					modalTriggerElementId: { 'eventbrite-widget-modal-trigger-${ eventId }' },
				});
			</script>
		`;

		/* eslint-disable */
		return <div dangerouslySetInnerHTML={ { __html: html } } />;
	},
};
