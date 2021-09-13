import classnames from 'classnames';
import { SocialServiceIcon } from '../../../../shared/icons';

/**
 * Style dependencies
 */
import './style.scss';

type PublicizeIconProps = {
	className: string;
	checked: boolean;
	id: string;
	disabled: boolean;
	onChange: React.ChangeEventHandler;
	serviceName: string;
};

/**
 * Publicize Icon for re-publicize re-design.
 * @param props
 * @returns
 */
const PublicizeIcon: React.FC< PublicizeIconProps > = props => {
	const { className, checked, id, disabled, onChange, serviceName } = props;

	const wrapperClasses = classnames( 'components-publicize-icon', className, {
		'is-not-checked': ! checked,
		'is-disabled': disabled,
	} );

	return (
		<span className={ wrapperClasses }>
			<input
				className="components-publicize-icon__input"
				id={ id }
				type="checkbox"
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
				{ ...props }
			/>
			<SocialServiceIcon
				serviceName={ serviceName }
				className="jetpack-publicize-gutenberg-social-icon"
			/>
		</span>
	);
};

export default PublicizeIcon;
