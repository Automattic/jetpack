import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

function SharingButton( { className, selected, onClick, children } ) {
	const getButtonVariant = useCallback( () => {
		return selected ? 'primary' : 'secondary';
	}, [ selected ] );

	return (
		<Button
			className={ className }
			isPrimary={ selected }
			onClick={ onClick }
			variant={ getButtonVariant() }
		>
			{ children }
		</Button>
	);
}

SharingButton.defaultProps = {
	selected: false,
	service: null,
	onClick: () => {},
};

export default SharingButton;
