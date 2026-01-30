import { Path } from '@wordpress/components';
import renderMaterialIcon from '../shared/components/render-material-icon.jsx';

export default {
	src: renderMaterialIcon(
		<Path
			fillRule="evenodd"
			d="M4.5 7H19.5V19C19.5 19.2761 19.2761 19.5 19 19.5H5C4.72386 19.5 4.5 19.2761 4.5 19V7ZM3 5V7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5ZM11 9.25H7V13.25H11V9.25Z"
		/>
	),
};
