/**
 * External dependencies
 */
import { memo } from '@wordpress/element';

const MediaPlaceholder = memo( function MediaPlaceholder() {
	const className =
		'jetpack-external-media-browser__media__item jetpack-external-media-browser__media__placeholder';
	return (
		<>
			<div className={ className }></div>
			<div className={ className }></div>
			<div className={ className }></div>
		</>
	);
} );

export default MediaPlaceholder;
