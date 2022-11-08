/**
 * External dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const VideoChaptersStyleControl = ( { value, onChange } ) => (
	<ToggleGroupControl
		label={ __( 'Style', 'jetpack-videopress-pkg' ) }
		value={ value }
		isBlock
		onChange={ onChange }
	>
		<ToggleGroupControlOption
			value="thumbnails"
			label={ __( 'Thumbnails', 'jetpack-videopress-pkg' ) }
		/>
		<ToggleGroupControlOption value="list" label={ __( 'List', 'jetpack-videopress-pkg' ) } />
	</ToggleGroupControl>
);

export default VideoChaptersStyleControl;
