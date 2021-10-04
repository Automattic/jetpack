/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { FormToggle } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ConnectionIcon from '../connection-icon';

/**
 * Style dependencies
 */
import './style.scss';

type ConnectionToggleProps = {
	className: string;
	checked: boolean;
	id: string;
	disabled: boolean;
	onChange: () => void;
	serviceName: string;
	label: string;
	profilePicture: string;
};

const ConnectionToggle: React.FC< ConnectionToggleProps > = props => {
	const { className, checked, id, disabled, onChange, serviceName, label, profilePicture } = props;

	const wrapperClasses = classnames( 'components-connection-toggle', {
		'is-not-checked': ! checked,
		'is-disabled': disabled,
	} );

	return (
		<div className={ wrapperClasses }>
			<ConnectionIcon
				id={ id }
				serviceName={ serviceName }
				label={ label }
				profilePicture={ profilePicture }
			/>
			<FormToggle id={ id } className={ className } checked={ checked } onChange={ onChange } />
		</div>
	);
};

export default ConnectionToggle;
