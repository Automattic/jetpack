import styles from './onboarding-welcome-modal.module.scss';
import { STORE_STAGE_BACKGROUND } from './store-stage-background';

/**
 * The WooCommerce slide's stage: the Woo wordmark pointing at the Stats bars.
 *
 * @return The illustration.
 */
export function StoreIllustration() {
	return (
		<div
			className={ styles.storeStage }
			style={ { backgroundImage: `url(${ STORE_STAGE_BACKGROUND })` } }
			aria-hidden="true"
		>
			<svg width="108" height="28" viewBox="0 0 108 28" fill="#fff">
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M45.5294 0C43 0 41.3529 0.825263 39.8824 3.59579L33.1765 16.2695V5.01053C33.1765 1.65053 31.5882 0 28.6471 0C25.7059 0 24.4706 1.00211 23 3.83158L16.6471 16.2695V5.12842C16.6471 1.53263 15.1765 0 11.5882 0H4.29412C1.52941 0 0 1.29684 0 3.65474C0 6.01263 1.47059 7.42737 4.17647 7.42737H7.17647V21.6337C7.17647 25.6421 9.88235 28 13.7647 28C17.6471 28 19.4118 26.4674 21.3529 22.8716L25.5882 14.9137V21.6337C25.5882 25.5832 28.1765 28 32.1176 28C36.0588 28 37.5294 26.6442 39.7647 22.8716L49.5294 6.36632C51.6471 2.77053 50.1765 0 45.4706 0C45.4706 0 45.4706 0 45.5294 0Z"
				/>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M63.8823 0C55.8823 0 49.8235 5.95368 49.8235 14.0295C49.8235 22.1053 55.9412 28 63.8823 28C71.8235 28 77.8823 22.0463 77.9412 14.0295C77.9412 5.95368 71.8235 0 63.8823 0ZM63.8823 19.3937C60.8823 19.3937 58.8235 17.1537 58.8235 14.0295C58.8235 10.9053 60.8823 8.60632 63.8823 8.60632C66.8823 8.60632 68.9412 10.9053 68.9412 14.0295C68.9412 17.1537 66.9412 19.3937 63.8823 19.3937Z"
				/>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M93.9412 0C86 0 79.8824 5.95368 79.8824 14.0295C79.8824 22.1053 86 28 93.9412 28C101.882 28 108 22.0463 108 14.0295C108 6.01263 101.882 0 93.9412 0ZM93.9412 19.3937C90.8824 19.3937 88.9412 17.1537 88.9412 14.0295C88.9412 10.9053 90.9412 8.60632 93.9412 8.60632C96.9412 8.60632 99 10.9053 99 14.0295C99 17.1537 97 19.3937 93.9412 19.3937Z"
				/>
			</svg>
			{ /* Mirrored in RTL, so it keeps pointing from Woo to Stats. */ }
			<svg className={ styles.storeArrow } width="24" height="24" viewBox="0 0 24 24" fill="none">
				<path
					d="M4 12h15m0 0-6-6m6 6-6 6"
					stroke="#fff"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<svg width="32" height="32" viewBox="0 0 32 32" fill="#fff">
				<rect x="0" y="20" width="8" height="12" rx="4" />
				<rect x="12" y="12" width="8" height="20" rx="4" />
				<rect x="24" y="0" width="8" height="32" rx="4" />
			</svg>
		</div>
	);
}
