import { Icon, warning, info, check, close } from '@wordpress/icons';
import clsx from 'clsx';
import React from 'react';
import styles from './style.module.scss';

type NoticeProps = {
	/** The severity of the alert. */
	level: 'error' | 'warning' | 'info' | 'success';

	/** The title of the notice */
	title: string;

	/** A list of action elements to show across the bottom */
	actions?: React.ReactNode[];

	/** Hide close button */
	hideCloseButton?: boolean;

	/** Method to call when the close button is clicked */
	onClose?: () => void;

	/** Children to be rendered inside the alert. */
	children: React.ReactNode;
};

const getIconByLevel = ( level: NoticeProps[ 'level' ] ) => {
	switch ( level ) {
		case 'error':
			return warning;
		case 'warning':
			return warning;
		case 'info':
			return info;
		case 'success':
			return check;
		default:
			return warning;
	}
};

/**
 * Notice component
 *
 * @param {object} props                    - The component properties.
 * @param {string} props.level              - The notice level: error, warning, info, success.
 * @param {boolean} props.hideCloseButton   - Whether to hide the close button.
 * @param {Function} props.onClose          - The function to call when the close button is clicked.
 * @param {string} props.title              - The title of the notice.
 * @param {React.ReactNode[]} props.actions - Actions to show across the bottom of the bar.
 * @param {React.Component} props.children  - The notice content.
 * @returns {React.ReactElement}              The `Notice` component.
 */
const Notice: React.FC< NoticeProps > = ( {
	level = 'info',
	title,
	children,
	actions,
	hideCloseButton = false,
	onClose,
} ) => {
	const classes = clsx( styles.container, styles[ `is-${ level }` ] );

	return (
		<div className={ classes }>
			<div className={ styles[ 'icon-wrapper' ] }>
				<Icon icon={ getIconByLevel( level ) } className={ styles.icon } />
			</div>

			<div className={ styles[ 'main-content' ] }>
				{ title && <div className={ styles.title }>{ title }</div> }
				{ children }

				{ actions && actions.length > 0 && (
					<div className={ styles[ 'action-bar' ] }>
						{ actions.map( ( action, index ) => (
							<div key={ index } className={ styles.action }>
								{ action }
							</div>
						) ) }
					</div>
				) }
			</div>

			{ ! hideCloseButton && (
				<button aria-label="close" className={ styles[ 'close-button' ] } onClick={ onClose }>
					<Icon icon={ close } />
				</button>
			) }
		</div>
	);
};

export default Notice;
