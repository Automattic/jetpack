/**
 * Internal dependencies
 */
import { ButtonSave } from '../../shared/components/button';

export default function save( { attributes } ) {
	const { eventId, useModal, url } = attributes;

	if ( ! eventId ) {
		return;
	}

	if ( useModal ) {
		return (
			<ButtonSave
				attributes={ { ...attributes, buttonUrl: url } }
				blockName="eventbrite"
				uniqueId={ `eventbrite-widget-${ eventId }` }
			/>
		);
	}

	return (
		url && (
			<a className="eventbrite__direct-link" href={ url }>
				{ url }
			</a>
		)
	);
}
