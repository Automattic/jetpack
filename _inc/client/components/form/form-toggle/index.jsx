/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Fragment, useRef, useState } from 'react';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Disabled, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Popover from 'components/popover';

import './style.scss';

const FormToggle = props => {
	const [ showPopover, setPopoverState ] = useState( false );
	const toggleSwitch = useRef( null );
	const {
		className,
		checked = false,
		children,
		disabled = false,
		disabledPopoverPosition = 'bottom',
		disabledReason = '',
		onChange,
		toggling,
	} = props;

	/**
	 * Toggle feature/option,
	 * or trigger info popover if feature/option is disabled.
	 */
	function onClick() {
		if ( ! disabled ) {
			onChange();
		} else if ( disabledReason ) {
			setPopoverState( setPopoverState );
		}
	}

	const renderPopover = () => {
		return (
			<Popover
				isVisible={ showPopover }
				context={ toggleSwitch }
				position={ disabledPopoverPosition }
				onClose={ setPopoverState( false ) }
				className="dops-info-popover__tooltip"
			>
				{ disabledReason }
			</Popover>
		);
	};

	const DisabledComponent = disabled ? Disabled : Fragment;
	const toggleClasses = classNames( 'form-toggle', className, {
		'is-toggling': toggling,
	} );

	return (
		<DisabledComponent>
			<ToggleControl
				checked={ checked }
				className={ toggleClasses }
				label={ children }
				onChange={ onClick }
			/>
			{ renderPopover }
		</DisabledComponent>
	);
};

FormToggle.propTypes = {
	checked: PropTypes.bool,
	children: PropTypes.node,
	className: PropTypes.string,
	disabled: PropTypes.bool,
	disabledPopoverPosition: PropTypes.string,
	disabledReason: PropTypes.string,
	onChange: PropTypes.func,
	toggling: PropTypes.bool,
};

export default FormToggle;
