import './style.scss';

/**
 * Connection-error illustration.
 *
 * Fills are themed via `style.scss` so the illustration follows the active
 * design-system brand color rather than the standalone app's hardcoded purple.
 *
 * @return The connection-error illustration SVG.
 */
export function ConnectionError() {
	return (
		<svg
			className="jetpack-premium-analytics-connection-error"
			width="68"
			height="67"
			viewBox="0 0 68 67"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				className="jetpack-premium-analytics-connection-error__shape--light"
				d="M33.9998 66.9996C52.401 66.9996 67.318 52.0826 67.318 33.6815C67.318 15.2803 52.401 0.363281 33.9998 0.363281C15.5987 0.363281 0.681641 15.2803 0.681641 33.6815C0.681641 52.0826 15.5987 66.9996 33.9998 66.9996Z"
			/>
			<path
				className="jetpack-premium-analytics-connection-error__shape--strong"
				d="M33.9998 56.7974C37.2505 56.7974 39.8858 54.1622 39.8858 50.9114C39.8858 47.6606 37.2505 45.0254 33.9998 45.0254C30.749 45.0254 28.1138 47.6606 28.1138 50.9114C28.1138 54.1622 30.749 56.7974 33.9998 56.7974Z"
			/>
			<path
				className="jetpack-premium-analytics-connection-error__shape--strong"
				d="M35.1957 10.5566H32.803C28.1493 10.5566 25.8284 12.8775 26.6897 17.8065C27.6947 23.4891 29.884 36.6369 30.4702 39.891L33.9994 39.9149L37.5286 39.891C38.1148 36.6489 40.3041 23.4891 41.309 17.8065C42.1824 12.8775 39.8615 10.5566 35.1957 10.5566Z"
			/>
			<path
				className="jetpack-premium-analytics-connection-error__shape--dark"
				d="M41.3093 17.8065C42.1826 12.8775 39.8617 10.5566 35.1959 10.5566H32.8032C29.7765 10.5566 27.7547 11.5376 26.9292 13.5714L39.3951 28.9564C40.1009 24.7931 40.8307 20.4743 41.3093 17.8065Z"
			/>
		</svg>
	);
}
