
/**
 * Internal dependencies
 */
import MediaButtonMenu from './media-menu';

function MediaButton( props ) {
	const { mediaProps } = props;
	return (
		<div>
			<MediaButtonMenu mediaProps={ mediaProps } />
		</div>
	);
}

export default MediaButton;
