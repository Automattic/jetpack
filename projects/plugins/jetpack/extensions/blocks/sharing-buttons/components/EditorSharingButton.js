import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

function EditorSharingButton({ className, selected, onClick, children }) {
	const getButtonVariant = useCallback(() => {
		return selected ? 'primary' : 'secondary';
	}, [selected]);

	return (
		<Button
			className={className}
			isPrimary={selected}
			onClick={onClick}
			variant={getButtonVariant()}
		>
			{children}
		</Button>
	);
}

EditorSharingButton.defaultProps = {
	selected: false,
	service: null,
	onClick: () => {},
};

export default EditorSharingButton;
