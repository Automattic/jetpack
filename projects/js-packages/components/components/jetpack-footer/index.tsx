import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import classnames from 'classnames';
import React from 'react';
import AutomatticBylineLogo from '../automattic-byline-logo';
import './style.scss';
import JetpackLogo from '../jetpack-logo';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import type { JetpackFooterProps } from './types';

const JetpackIcon: React.FC = () => (
	<JetpackLogo logoColor="#000" showText={ false } height={ 16 } aria-hidden="true" />
);

/**
 * JetpackFooter component displays a tiny Jetpack logo with the product name on the left and the Automattic Airline "by line" on the right.
 *
 * @param {JetpackFooterProps} props - Component properties.
 * @returns {React.ReactNode} JetpackFooter component.
 */
const JetpackFooter: React.FC< JetpackFooterProps > = ( {
	a8cLogoHref = 'https://automattic.com',
	moduleName = __( 'Jetpack', 'jetpack' ),
	className,
	moduleNameHref = 'https://jetpack.com',
	menu,
	...otherProps
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm', '<=' );
	const [ isMd ] = useBreakpointMatch( 'md', '<=' );
	const [ isLg ] = useBreakpointMatch( 'lg', '>' );

	const jetpackItemContent = (
		<>
			<JetpackIcon />
			{ moduleName }
		</>
	);

	return (
		<footer
			className={ classnames(
				'jp-dashboard-footer',
				{
					'is-sm': isSm,
					'is-md': isMd,
					'is-lg': isLg,
				},
				className
			) }
			aria-label={ __( 'Jetpack', 'jetpack' ) }
			{ ...otherProps }
		>
			<ul>
				<li className="jp-dashboard-footer__jp-item">
					{ moduleNameHref ? (
						<a href={ moduleNameHref }>{ jetpackItemContent }</a>
					) : (
						jetpackItemContent
					) }
				</li>
				{ menu?.map( item => {
					const isButton = item.role === 'button';
					const isExternalLink = ! isButton && item.target === '_blank';

					return (
						<li key={ item.label }>
							<a
								href={ item.href }
								title={ item.title }
								target={ item.target }
								onClick={ item.onClick }
								onKeyDown={ item.onKeyDown }
								className={ classnames( 'jp-dashboard-footer__menu-item', {
									'is-external': isExternalLink,
								} ) }
								role={ item.role }
								rel={ isExternalLink ? 'noopener noreferrer' : undefined }
								tabIndex={ isButton ? 0 : undefined }
							>
								{ item.label }
								{ isExternalLink && <Icon icon={ external } size={ 16 } /> }
							</a>
						</li>
					);
				} ) }
				<li className="jp-dashboard-footer__a8c-item">
					<a href={ a8cLogoHref } aria-label={ __( 'An Automattic Airline', 'jetpack' ) }>
						<AutomatticBylineLogo aria-hidden="true" />
					</a>
				</li>
			</ul>
		</footer>
	);
};

export default JetpackFooter;
