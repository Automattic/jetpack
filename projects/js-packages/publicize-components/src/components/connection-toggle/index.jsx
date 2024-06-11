import clsx from 'clsx';
import PropTypes from 'prop-types';
import ConnectionIcon from '../connection-icon';

import './style.scss';

const ConnectionToggle = props => {
	const { checked, disabled, onChange, serviceName, label, profilePicture } = props;
	const wrapperClasses = clsx( 'components-connection-toggle', {
		'is-not-checked': ! checked,
		'is-disabled': disabled,
	} );

	return (
		<div className={ wrapperClasses } title={ label }>
			<ConnectionIcon
				checked={ checked }
				label={ label }
				onClick={ onChange }
				serviceName={ serviceName }
				profilePicture={ profilePicture }
			/>
		</div>
	);
};

ConnectionToggle.propTypes = {
	className: PropTypes.string,
	checked: PropTypes.bool,
	id: PropTypes.string.isRequired,
	disabled: PropTypes.bool,
	onChange: PropTypes.func,
	serviceName: PropTypes.string,
	label: PropTypes.string,
	profilePicture: PropTypes.string,
};

export default ConnectionToggle;
