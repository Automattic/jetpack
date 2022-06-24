import { Path, G } from '@wordpress/components';
import renderMaterialIcon from '../../shared/render-material-icon';

const icon = renderMaterialIcon(
	<G>
		<Path d="M17 5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2h9z" />
		<Path d="M13 4H5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z" />
		<Path d="M7 16h8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
	</G>
);

export default icon;
