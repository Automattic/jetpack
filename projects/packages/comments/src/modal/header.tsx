/**
 * The site's icon and name, and the close button.
 *
 * @param props         - Component props.
 * @param props.onClose - Closes the dialog.
 * @return The header.
 */
export const Header = ( { onClose }: { onClose: () => void } ) => {
	const { site, strings } = JetpackComments;

	return (
		<div className="jetpack-comments__dialog-header">
			{ site.iconUrl && (
				<img
					className="jetpack-comments__site-icon"
					src={ site.iconUrl }
					alt=""
					width="36"
					height="36"
				/>
			) }
			<span id="title" className="jetpack-comments__dialog-title">
				{ site.name }
			</span>
			<button type="button" className="jetpack-comments__dialog-close" onClick={ onClose }>
				<span className="jetpack-comments__visually-hidden">{ strings.close }</span>
				{ /* @wordpress/icons "close". */ }
				<svg
					viewBox="0 0 24 24"
					width="24"
					height="24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M5 19L19 5M19 19L5 5" vectorEffect="non-scaling-stroke" />
				</svg>
			</button>
		</div>
	);
};
