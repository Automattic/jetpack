import { Card, CardBody } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import Button from '../button/index.tsx';
import { UpsellBannerProps } from './types.ts';
import type { FC, ReactNode } from 'react';

import './style.scss';

/**
 * Upsell banner component.
 *
 * - The primary CTA is the second button, at the right position.
 * - The secondary CTA is the first button, at the left position.
 * - Passing `onDismiss` renders a close button in the top corner of the banner.
 *
 * @param {UpsellBannerProps} props - Component props.
 * @return {ReactNode} - UpsellBanner component.
 */
const UpsellBanner: FC< UpsellBannerProps > = props => {
	const {
		icon,
		title,
		description,
		primaryCtaLabel,
		primaryCtaURL,
		primaryCtaIsExternalLink,
		primaryCtaOnClick,
		secondaryCtaLabel,
		secondaryCtaURL,
		secondaryCtaIsExternalLink,
		secondaryCtaOnClick,
		onDismiss,
		dismissLabel,
	} = props;

	return (
		<Card isRounded={ true } size="large">
			<CardBody className="upsell-banner" size="large">
				{ onDismiss && (
					<Button
						className="upsell-banner--dismiss"
						variant="tertiary"
						size="small"
						icon={ close }
						iconSize={ 16 }
						// Button wraps its children in a span, so the tooltip an icon-only
						// WPButton would show on its own has to be asked for explicitly.
						showTooltip={ true }
						label={ dismissLabel || __( 'Dismiss', 'jetpack-components' ) }
						onClick={ onDismiss }
					/>
				) }
				{ icon && (
					<div className="upsell-banner--icon">
						<img src={ icon } alt="" />
					</div>
				) }
				<div className="upsell-banner--content">
					<div className="upsell-banner--content-info">
						<h3>{ title }</h3>
						<p>
							{ createInterpolateElement( description, {
								br: <br />,
							} ) }
						</p>
					</div>
					<div className="upsell-banner--content-cta">
						{ secondaryCtaLabel && secondaryCtaURL && (
							<Button
								className="upsell-banner--content-cta-button secondary"
								href={ secondaryCtaURL }
								onClick={ secondaryCtaOnClick ?? undefined }
								isExternalLink={ secondaryCtaIsExternalLink }
							>
								{ secondaryCtaLabel }
							</Button>
						) }
						{ primaryCtaLabel && primaryCtaURL && (
							<Button
								className="upsell-banner--content-cta-button primary"
								href={ primaryCtaURL }
								onClick={ primaryCtaOnClick ?? undefined }
								isExternalLink={ primaryCtaIsExternalLink }
							>
								{ primaryCtaLabel }
							</Button>
						) }
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default UpsellBanner;
