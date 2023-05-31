import { Warning } from '@wordpress/block-editor';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import useAutosaveAndRedirect from '../../../shared/use-autosave-and-redirect/index';

import './style.scss';

export default function BlockNudge( {
	blockName,
	buttonLabel,
	className,
	href,
	icon,
	onClick,
	readMoreUrl,
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
			className={ classNames( className, 'jetpack-block-nudge wp-block' ) }
		>
			<span className="jetpack-block-nudge__info">
				{ icon }
				<span className="jetpack-block-nudge__text-container">
					<span className="jetpack-block-nudge__title">{ title }</span>
					{ ( subtitle || readMoreUrl ) && (
						<span className="jetpack-block-nudge__message">
							{ subtitle && subtitle + ' ' }
							{ readMoreUrl && (
								<ExternalLink href={ readMoreUrl }>{ __( 'Read more', 'jetpack' ) }</ExternalLink>
							) }
						</span>
					) }
				</span>
			</span>
		</Warning>
	);
}
