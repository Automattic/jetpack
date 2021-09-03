import classnames from 'classnames';

type PublicizeIconProps = {
	className: string;
	checked: boolean;
	id: string;
	disabled: boolean;
	onChange: React.ChangeEventHandler;
};

/**
 * Publicize Icon for re-publicize re-design.
 * @param props
 * @returns
 */
const PublicizeIcon: React.FC< PublicizeIconProps > = props => {
	const { className, checked, id, disabled, onChange } = props;

	const wrapperClasses = classnames( 'components-publicize-icon', className, {
		'is-checked': checked,
		'is-disabled': disabled,
	} );

	return (
		<span className={ wrapperClasses }>
			<input
				className="components-publicize-icon"
				id={ id }
				type="checkbox"
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
				{ ...props }
			/>
			<span className="components-publicize-icon__track"></span>
			<span className="components-publicize-icon__thumb"></span>
		</span>
	);
};

export default PublicizeIcon;
