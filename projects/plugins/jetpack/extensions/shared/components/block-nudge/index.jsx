import { useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import { Warning } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import clsx from 'clsx';

import './style.scss';

export default function BlockNudge( {
	blockName,
	buttonLabel,
	className,
	href,
	icon,
	links,
	onClick,
	subtitle,
	title,
} ) {
	const { autosaveAndRedirect } = useAutosaveAndRedirect( href );

	const handleClick = event => {
		event.preventDefault();
		onClick( blockName );
		autosaveAndRedirect( event );
	};

	return (
		<Warning
			actions={
				// Use href to determine whether or not to display the Upgrade button.
				href && [
					<Button
						key="nudge"
						href={ href } // Only for server-side rendering, since onClick doesn't work there.
						onClick={ handleClick }
						target="_top"
						variant="secondary"
						className="jetpack-stripe-nudge__link"
					>
						{ buttonLabel }
					</Button>,
				]
			}
			className={ clsx( className, 'jetpack-block-nudge wp-block' ) }
		>
			<span className="jetpack-block-nudge__info">
				{ icon }
				<span className="jetpack-block-nudge__text-container">
					<span className="jetpack-block-nudge__title">{ title }</span>
					{ subtitle && <span className="jetpack-block-nudge__message">{ subtitle }</span> }
					{ links && <span className="jetpack-block-nudge__links">{ links }</span> }
				</span>
			</span>
		</Warning>
	);
}
