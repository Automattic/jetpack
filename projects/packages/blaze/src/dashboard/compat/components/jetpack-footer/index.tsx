// Ported from wp-calypso client/components/jetpack/jetpack-footer.
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import JetpackLogo from '../jetpack-logo';
import AutomatticBylineLogo from './automattic-byline-logo';
import type { FC } from 'react';

import './style.scss';

export interface JetpackFooterMenuItem {
	label: string;
	title?: string;
	href?: string;
	role?: string;
	onClick?: () => void;
	onKeyDown?: () => void;
}

export interface JetpackFooterProps {
	className?: string;
	menu?: JetpackFooterMenuItem[];
	/** Product name shown next to the logo. Defaults to 'Jetpack'. */
	name?: string;
	/** Whether to show the Jetpack logo next to the name. Defaults to true. */
	showLogo?: boolean;
}

/**
 * Footer with the Jetpack logo and product name, an optional menu, and the Automattic byline.
 *
 * @param props           - Component props.
 * @param props.className
 * @param props.menu
 * @param props.name
 * @param props.showLogo
 * @return The footer.
 */
const JetpackFooter: FC< JetpackFooterProps > = ( { className, menu, name, showLogo = true } ) => {
	return (
		<Stack
			render={ <footer /> }
			className={ clsx( 'jetpack-footer', className ) }
			aria-label={ name ?? __( 'Jetpack', 'jetpack-blaze' ) }
			role="contentinfo"
			direction="row"
			justify="flex-start"
			align="center"
			wrap="wrap"
			gap="xl"
		>
			<Stack className="jetpack-footer__logo" direction="row" gap="sm" align="center">
				{ showLogo && <JetpackLogo size={ 16 } monochrome={ false } aria-hidden="true" /> }
				<span className="jetpack-footer__logo-text">{ name ?? 'Jetpack' }</span>
			</Stack>
			{ menu && menu.length > 0 && (
				<Stack render={ <ul /> } direction="row" gap="lg" wrap="wrap">
					{ menu.map( item => {
						const isButton = item.role === 'button';

						return (
							<li key={ item.label }>
								{ isButton ? (
									<span
										className="jetpack-footer__menu-item"
										role="button"
										tabIndex={ 0 }
										onClick={ item.onClick }
										onKeyDown={ item.onKeyDown }
									>
										{ item.label }
									</span>
								) : (
									<a
										className="jetpack-footer__menu-item"
										href={ item.href }
										title={ item.title }
										onClick={ item.onClick }
										onKeyDown={ item.onKeyDown }
									>
										{ item.label }
									</a>
								) }
							</li>
						);
					} ) }
				</Stack>
			) }
			<a
				className="jetpack-footer__a8c"
				href="https://jetpack.com/redirect/?source=a8c-about"
				rel="noopener noreferrer"
				target="_blank"
			>
				<AutomatticBylineLogo height={ 8 } />
			</a>
		</Stack>
	);
};

export default JetpackFooter;
