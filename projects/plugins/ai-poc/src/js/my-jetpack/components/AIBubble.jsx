import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AIPopup from './AIPopup';
import './AIBubble.scss';

const AIBubble = () => {
	const [ isOpen, setIsOpen ] = useState( false );

	const togglePopup = () => {
		setIsOpen( ! isOpen );
	};

	return (
		<>
			<button
				className="jetpack-ai-poc-bubble"
				onClick={ togglePopup }
				aria-label={ __( 'Open AI Assistant', 'jetpack-starter-plugin' ) }
				title={ __( 'AI Assistant', 'jetpack-starter-plugin' ) }
			>
				<svg
					width="32"
					height="32"
					viewBox="0 0 32 32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0Z"
						fill="#069E08"
					/>
					<path
						d="M16.0183 9.6001L9.60986 12.8037L9.60986 19.1964L16.0183 22.4L22.4268 19.1964V12.8037L16.0183 9.6001Z"
						fill="white"
					/>
					<path
						d="M16.0183 10.9091L10.9185 13.4546V18.5455L16.0183 21.0909L21.1181 18.5455V13.4546L16.0183 10.9091Z"
						fill="#069E08"
					/>
					<path
						d="M16.0183 16L10.2732 13.0909L10.2732 18.9091L16.0183 22.4L21.7634 18.9091L21.7634 13.0909L16.0183 16Z"
						fill="white"
					/>
				</svg>
			</button>

			{ isOpen && <AIPopup onClose={ () => setIsOpen( false ) } /> }
		</>
	);
};

export default AIBubble;
