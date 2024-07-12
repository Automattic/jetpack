import { useBlockProps } from '@wordpress/block-editor';
import EventCountDown from './event-countdown';

const save = ( { attributes } ) => {
	const blockProps = useBlockProps.save( {
		className: 'wp-block-jetpack-event-countdown',
	} );

	return (
		<div { ...blockProps }>
			<EventCountDown
				eventTitle={ attributes.eventTitle }
				eventTimestamp={ attributes.eventTimestamp }
				eventDate={ attributes.eventDate }
			/>
		</div>
	);
};

export default save;
