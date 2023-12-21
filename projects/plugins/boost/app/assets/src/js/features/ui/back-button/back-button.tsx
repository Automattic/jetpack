import { __ } from '@wordpress/i18n';
import { navigate } from '$lib/utils/navigate';
import LeftArrow from '$svg/left-arrow';

type BackButtonProps = {
	route?: string;
};

const BackButton: React.FC< BackButtonProps > = ( { route = '/' } ) => {
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
