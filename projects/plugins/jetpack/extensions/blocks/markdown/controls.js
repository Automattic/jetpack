import classnames from 'classnames';

const ToolbarButton = ( { className, label, isPressed, onClick } ) => {
	const buttonClassnames = classnames( className, 'components-button components-tab-button', {
		'is-pressed': isPressed,
	} );

	return (
		<button className={ buttonClassnames } onClick={ onClick }>
			<span>{ label }</span>
		</button>
	);
};

export default ToolbarButton;
