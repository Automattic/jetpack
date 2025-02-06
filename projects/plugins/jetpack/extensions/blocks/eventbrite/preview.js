import { SandBox } from '@wordpress/components';

const InlinePreview = ( { className, attributes } ) => {
	const { eventId } = attributes;

	if ( ! eventId ) {
		return;
	}

	const widgetId = `eventbrite-widget-${ eventId }`;
	const html = `
			<script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
			<style>
				/* Prevent scrollbar on the embed preview */
				body {
					overflow: hidden;
				}
				/* Eventbrite embeds have a CSS height transition on loading, which causes <Sandbox>
				to not recognise the resizing. We need to disable that transition. */
				* {
					transition: none !important;
				}
			</style>
			<script>
				window.EBWidgets.createWidget({
					widgetType: 'checkout',
					eventId: ${ eventId },
					iframeContainerId: '${ widgetId }',
				});
			</script>
			<div id="${ widgetId }"></div>
		`;

	return (
		<div className={ className }>
			<SandBox html={ html } />
			{ /* Use an overlay to prevent interactivity with the preview, since the preview does not always resize correctly. */ }
			<div className="block-library-embed__interactive-overlay" />
		</div>
	);
};

export default InlinePreview;
