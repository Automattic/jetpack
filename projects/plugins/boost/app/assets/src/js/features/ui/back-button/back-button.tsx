import { __ } from '@wordpress/i18n';
import LeftArrow from '$svg/left-arrow';
import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
	route?: string;
};

const BackButton: React.FC< BackButtonProps > = ( { route = '/' } ) => {
	const navigate = useNavigate();
	const handleBack = () => {
		navigate( route );
	};

	return (
		<button
			className="components-button components-button--back is-link close"
			onClick={ handleBack }
		>
			<LeftArrow />
			{ __( 'Go back', 'jetpack-boost' ) }
		</button>
	);
};

export default BackButton;
