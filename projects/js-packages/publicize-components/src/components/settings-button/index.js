/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useReducer, useState } from 'react';
import AddConnectionModal from '../add-connection-modal';
import styles from './styles.module.scss';

/**
 * The link to manage connections displayed at the end of the toggles.
 *
 * @returns {object} The link/button component.
 */
export default function PublicizeSettingsButton() {
	const [ currentService, setCurrentService ] = useState( null );
	const [ isModalOpen, toggleModal ] = useReducer( state => ! state, false );

	return (
		<ThemeProvider targetDom={ document.body }>
			<button
				className={ styles[ 'settings-link' ] }
				onClick={ toggleModal }
				title={ __( 'Connect an account', 'jetpack' ) }
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 28 28"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect x="0.375" y="0.375" width="27.25" height="27.25" rx="1.125" fill="#F6F7F7" />
					<path
						d="M19 13.3333H14.6667V9H13.3333V13.3333H9V14.6667H13.3333V19H14.6667V14.6667H19V13.3333Z"
						fill="black"
					/>
					<rect
						x="0.375"
						y="0.375"
						width="27.25"
						height="27.25"
						rx="1.125"
						stroke="#A7AAAD"
						strokeWidth="0.75"
						strokeDasharray="2 2"
					/>
				</svg>
			</button>
			{ isModalOpen && (
				<AddConnectionModal
					onCloseModal={ toggleModal }
					currentService={ currentService }
					setCurrentService={ setCurrentService }
				/>
			) }
		</ThemeProvider>
	);
}
