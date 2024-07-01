import clsx from 'clsx';

const ToolbarButton = ( { className, label, isPressed, onClick } ) => {
	const buttonClassnames = clsx( className, 'components-button components-tab-button', {
		'is-pressed': isPressed,
	} );

	return (
		<button className={ buttonClassnames } onClick={ onClick }>
			<span>{ label }</span>
		</button>
	);
};

export default ToolbarButton;
