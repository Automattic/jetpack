import { Path } from '@wordpress/components';
import renderMaterialIcon from '../shared/components/render-material-icon.jsx';

const StepContainerIcon = renderMaterialIcon(
	<>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M19 4.5H5C4.72386 4.5 4.5 4.72386 4.5 5V19C4.5 19.2761 4.72386 19.5 5 19.5H19C19.2761 19.5 19.5 19.2761 19.5 19V5C19.5 4.72386 19.2761 4.5 19 4.5ZM5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5Z"
		/>
		<Path d="M6.1001 6H12.1001V7.5H6.1001V6Z" />
		<Path
			d="M7.6001 9.75H16.6001C17.0143 9.75 17.3501 10.0858 17.3501 10.5V11.5C17.3501 11.9142 17.0143 12.25 16.6001 12.25H7.6001C7.18588 12.25 6.8501 11.9142 6.8501 11.5V10.5C6.8501 10.0858 7.18588 9.75 7.6001 9.75Z"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
		<Path
			d="M7.6001 14.75H16.6001C17.0143 14.75 17.3501 15.0858 17.3501 15.5V16.5C17.3501 16.9142 17.0143 17.25 16.6001 17.25H7.6001C7.18588 17.25 6.8501 16.9142 6.8501 16.5V15.5C6.8501 15.0858 7.18588 14.75 7.6001 14.75Z"
			strokeWidth="1.5"
			stroke="currentColor"
			fill="none"
		/>
	</>
);

export default StepContainerIcon;
