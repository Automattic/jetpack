import { ButtonGroup, Button, DropdownMenu } from '@wordpress/components';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './style.module.scss';

const DownIcon = () => (
	<svg width="15" height="9" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="10 9 4 7">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="m18.004 10.555-6.005 5.459-6.004-5.459 1.009-1.11 4.995 4.542 4.996-4.542 1.009 1.11Z"
		/>
	</svg>
);

const SplitButton = ( { variant, controls, popoverProps, toggleProps, ...buttonProps } ) => {
	return (
		<ButtonGroup className={ styles[ 'split-button' ] }>
			<Button variant={ variant } { ...buttonProps } className={ styles.button } />
			<DropdownMenu
				toggleProps={ { variant, className: styles.button, ...toggleProps } }
				popoverProps={ { noArrow: false, ...popoverProps } }
				icon={ DownIcon }
				disableOpenOnArrowDown={ true }
				controls={ controls }
			/>
		</ButtonGroup>
	);
};

SplitButton.propTypes = {
	popoverProps: PropTypes.object,
	toggleProps: PropTypes.object,
	controls: PropTypes.arrayOf( PropTypes.object ),
};

SplitButton.defaultProps = {
	controls: [
		{
			title: 'Control 1',
			icon: null,
			onClick: () => {},
		},
	],
};

export default SplitButton;
