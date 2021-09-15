/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SocialServiceIcon } from '../../../../shared/icons';

/**
 * Style dependencies
 */
import './style.scss';

type PublicizeCheckboxProps = {
	className: string;
	checked: boolean;
	id: string;
	disabled: boolean;
	onChange: React.ChangeEventHandler;
	serviceName: string;
	label: string;
	picture: string;
};

/**
 * Publicize checkbox with icon and username label.
 * @param props
 * @returns
 */
const PublicizeCheckbox: React.FC< PublicizeCheckboxProps > = props => {
	const { className, checked, id, disabled, onChange, serviceName, label, picture } = props;

	const wrapperClasses = classnames( 'components-publicize-icon', className, {
		'is-not-checked': ! checked,
		'is-disabled': disabled,
	} );

	return (
		<div className={ wrapperClasses }>
			<CheckboxControl
				className="components-publicize-icon__input"
				id={ id }
				type="checkbox"
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
			/>
			<img src={ picture } />
			<SocialServiceIcon
				serviceName={ serviceName }
				className="jetpack-publicize-gutenberg-social-icon"
			/>
			<label htmlFor={ id } className="jetpack-publicize-connection-label">
				<span className="jetpack-publicize-connection-label-copy">{ label }</span>
			</label>
		</div>
	);
};

export default PublicizeCheckbox;
