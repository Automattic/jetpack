import classNames from 'classnames';
import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import IconTooltip from '../icon-tooltip';
import styles from './styles.module.scss';

interface ToggleProps {
	/** The aria-label property for the <div> checkbox. */
	ariaLabel?: string;

	/** Whether or not the toggle is currently enabled. */
	checked?: boolean;

	/** Child components to render beside the toggle. */
	children?: React.ReactNode;

	/** Custom class name to append to the component. */
	className?: string;

	/** Whether or not the toggle is currently disabled. */
	disabled?: boolean;

	/** The reason the toggle is disabled - appears in a tooltip if the disabled toggle is clicked. */
	disabledReason?: string;

	/** The callback to fire when the toggle toggles. */
	onChange?: ( event: React.SyntheticEvent ) => void;
}

const Toggle: React.FC< ToggleProps > = ( {
	ariaLabel,
	checked = false,
	children,
	className,
	disabled = false,
	disabledReason,
	onChange,
} ) => {
	const toggleRef = useRef< HTMLLabelElement >();
	const [ showPopover, setShowPopover ] = useState( false );

	/**
	 * Toggle the toggle.
	 */
	const onToggle = useCallback(
		( event: React.SyntheticEvent ) => {
			event.preventDefault();

			// Show the info popover if there is a reason the toggle is disabled.
			if ( disabled && disabledReason ) {
				setShowPopover( true );
				return;
			}

			// If there is no event handler provided, there's nothing left to do.
			if ( disabled || ! onChange ) {
				return;
			}

			// Handle the toggle change event.
			onChange( event );
		},
		[ disabled, disabledReason, onChange ]
	);

	/**
	 * Handle click events.
	 */
	const onClick = useCallback(
		( event: React.SyntheticEvent ) => {
			const target = event.target as HTMLElement;
			const nodeName = target.nodeName.toLowerCase();

			// If the user is selecting text inside the label, don't toggle the toggle.
			if ( nodeName !== 'button' && window.getSelection().toString() ) {
				return;
			}

			// If the user is clicking an interactive element inside the label, don't toggle the toggle.
			if (
				nodeName === 'a' ||
				nodeName === 'input' ||
				nodeName === 'select' ||
				( nodeName === 'button' && target.getAttribute( 'role' ) !== 'checkbox' )
			) {
				return;
			}

			// Toggle the toggle.
			onToggle( event );
		},
		[ onToggle ]
	);

	/**
	 * Handle key down events.
	 *
	 * Adds support for using the enter key to toggle the toggle.
	 */
	const onKeyDown = useCallback(
		( event: React.KeyboardEvent ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				onToggle( event );
				return;
			}
		},
		[ onToggle ]
	);

	/**
	 * Close the popover when clicking outside of it.
	 */
	const handleOutsideClick = useCallback(
		( event: MouseEvent ) => {
			if ( toggleRef.current && ! toggleRef.current.contains( event.target as Node ) ) {
				setShowPopover( false );
			}
		},
		[ toggleRef ]
	);

	/**
	 * Add event listeners for detecting outside clicks.
	 */
	useEffect( () => {
		if ( showPopover ) {
			window.addEventListener( 'click', handleOutsideClick );
		} else {
			window.removeEventListener( 'click', handleOutsideClick );
		}

		return () => {
			window.removeEventListener( 'click', handleOutsideClick );
		};
	}, [ handleOutsideClick, showPopover ] );

	return (
		<>
			{ /* Disable ESLint here as button.form-toggle__switch is used for key events. */ }
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */ }
			<label
				className={ classNames( styles[ 'form-toggle' ], className ) }
				onClick={ onClick }
				ref={ toggleRef }
			>
				<IconTooltip
					className={ styles[ 'form-toggle__tooltip' ] }
					forceShow={ showPopover }
					placement="bottom-start"
					popoverAnchorStyle="wrapper"
				>
					{ disabledReason }
				</IconTooltip>
				<input
					checked={ checked }
					className={ styles[ 'form-toggle__input' ] }
					disabled={ disabled }
					readOnly={ true }
					type="checkbox"
				/>
				<button
					aria-checked={ checked }
					aria-label={ ariaLabel }
					className={ styles[ 'form-toggle__switch' ] }
					onKeyDown={ onKeyDown }
					role="checkbox"
					tabIndex={ disabled ? -1 : 0 }
				/>
				{ Boolean( children ) && (
					<div className={ styles[ 'form-toggle__content' ] }>{ children }</div>
				) }
			</label>
		</>
	);
};

export default Toggle;
