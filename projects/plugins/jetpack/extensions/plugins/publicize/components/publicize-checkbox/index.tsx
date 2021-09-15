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
	onChange: () => void;
	serviceName: string;
	label: string;
	picture: string;
};

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
			<div className="components-publicize-icon__picture">
				{ picture ? <img src={ picture } /> : <span className="placeholder" /> }
				<SocialServiceIcon
					serviceName={ serviceName }
					className="jetpack-publicize-gutenberg-social-icon"
				/>
			</div>
			<label htmlFor={ id } className="jetpack-publicize-connection-label">
				<span className="jetpack-publicize-connection-label-copy">{ label }</span>
			</label>
		</div>
	);
};

export default PublicizeCheckbox;
