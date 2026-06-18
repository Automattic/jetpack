import './style.scss';

/**
 * Connection illustration.
 *
 * Fills are themed via `style.scss` so the illustration follows the active
 * design-system brand color rather than the standalone app's hardcoded purple.
 *
 * @return The connection illustration SVG.
 */
export function Connection() {
	return (
		<svg
			className="jetpack-premium-analytics-connection"
			width="80"
			height="80"
			viewBox="0 0 80 80"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				className="jetpack-premium-analytics-connection__shape--strong"
				d="M73.5444 44.1328H50.5C46.3778 44.1328 44.0444 46.4328 44.0444 50.5402V73.5921C44.0444 77.6958 46.3815 79.9995 50.5037 79.9995H73.5444C77.6667 79.9995 80 77.6958 80 73.5921V50.5402C80 46.4365 77.663 44.1328 73.5407 44.1328H73.5444Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--light"
				d="M29.5 0H6.45556C2.33333 0 0 2.3 0 6.40741V29.4593C0 33.563 2.33704 35.8667 6.45926 35.8667H29.5C33.6222 35.8667 35.9556 33.563 35.9556 29.4593V6.40741C35.9556 2.3037 33.6185 0 29.4963 0H29.5Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--light"
				d="M29.5 44.1365H6.45556C2.33333 44.1365 0 46.4365 0 50.5402V73.5921C0 77.6958 2.33704 79.9995 6.45926 79.9995H29.5C33.6222 79.9995 35.9556 77.6958 35.9556 73.5921V50.5402C35.9556 46.4365 33.6185 44.1328 29.4963 44.1328L29.5 44.1365Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--light"
				d="M73.5444 0H50.5C46.3778 0 44.0444 2.3 44.0444 6.40741V29.4593C44.0444 33.563 46.3815 35.8667 50.5037 35.8667H73.5444C77.6667 35.8667 80 33.563 80 29.4593V6.40741C80 2.3037 77.663 0 73.5407 0H73.5444Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--strong"
				d="M17.9408 29.7605C24.4659 29.7605 29.7556 24.4708 29.7556 17.9457C29.7556 11.4205 24.4659 6.13086 17.9408 6.13086C11.4156 6.13086 6.12598 11.4205 6.12598 17.9457C6.12598 24.4708 11.4156 29.7605 17.9408 29.7605Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--dark"
				d="M17.9778 29.7594C24.4853 29.7409 29.7593 24.4594 29.7593 17.9446C29.7593 17.7483 29.7556 17.552 29.7445 17.3594H17.9778V29.7594Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--light"
				d="M63.6889 53.3457V68.5346H67.0185V53.3457H63.6889Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--light"
				d="M50.3667 58.3789V68.5382H53.6963V58.3789H50.3667Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--light"
				d="M70.3481 55.8672V68.4635H73.6778V55.8672H70.3481Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--light"
				d="M57.0259 55.8672V68.4635H60.3556V55.8672H57.0259Z"
			/>
			<path
				className="jetpack-premium-analytics-connection__shape--dark"
				d="M80 73.5881V68.877L49.0148 79.8807C49.4814 79.9547 49.9777 79.9918 50.5037 79.9918H73.5444C77.6666 79.9918 80 77.6881 80 73.5844V73.5881Z"
			/>
		</svg>
	);
}
