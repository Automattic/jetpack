/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { store } from '../../social-store';
import AddConnectionModal from '../add-connection-modal';
import styles from './styles.module.scss';

/**
 * The link to manage connections displayed at the end of the toggles.
 *
 * @returns {object} The link/button component.
 */
export default function PublicizeSettingsButton() {
	const { useAdminUiV1, keyringResult } = useSelect( select => {
		return {
			useAdminUiV1: select( store ).useAdminUiV1(),
			keyringResult: select( store ).getKeyringResult(),
		};
	}, [] );

	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const closeModal = useCallback( () => {
		setIsModalOpen( false );
	}, [] );
	const openModal = useCallback( () => {
		setIsModalOpen( true );
	}, [] );

	const shouldModalBeOpen =
		isModalOpen ||
		// It's possible that when reconnecting a connection from within the modal,
		// the user closes the modal immediately, without waiting for the confirmation,
		// in that case we should show the modal again when the keyringResult is set.
		keyringResult?.ID;

	return useAdminUiV1 ? (
		<ThemeProvider targetDom={ document.body }>
			<button
				className={ styles[ 'settings-link' ] }
				onClick={ openModal }
				title={ __( 'Connect an account', 'jetpack' ) }
				aria-label={ __( 'Connect an account', 'jetpack' ) }
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
			{ shouldModalBeOpen ? <AddConnectionModal onCloseModal={ closeModal } /> : null }
		</ThemeProvider>
	) : (
		<OldPublicizeSettingsButton />
	);
}

/**
 * Old Publicize settings button component.
 * Will be removed once we remove the feature flag.
 *
 * @returns {object} The link/button component.
 */
const OldPublicizeSettingsButton = () => {
	const { connectionsAdminUrl } = usePublicizeConfig();

	return (
		<a
			className={ styles[ 'settings-link' ] }
			href={ connectionsAdminUrl }
			target="_blank"
			rel="noreferrer"
			title={ __( 'Connect an account', 'jetpack' ) }
			aria-label={ __( 'Connect an account', 'jetpack' ) }
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
		</a>
	);
};
