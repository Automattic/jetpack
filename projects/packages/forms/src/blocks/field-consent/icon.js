import { Path } from '@wordpress/components';
import renderMaterialIcon from '../shared/components/render-material-icon.js';
import { FIELD_ICON_PATHS } from '../shared/icon-paths.js';

export default {
	src: renderMaterialIcon(
		<>
			{ FIELD_ICON_PATHS.consent.map( ( pathProps, i ) => (
				<Path key={ i } { ...pathProps } />
			) ) }
		</>
	),
};
