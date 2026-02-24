import { Button, Card, CardBody, VisuallyHidden } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { UpsellBannerProps } from './types.ts';
import type { FC, ReactNode } from 'react';

import './style.scss';

/**
 * Upsell banner component.
 *
 * - The primary CTA is the second button, at the right position.
 * - The secondary CTA is the first button, at the left position.
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
	} = props;

	return (
		<Card isRounded={ true } size="large">
			<CardBody className="upsell-banner" size="large">
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
								target={ secondaryCtaIsExternalLink ? '_blank' : undefined }
								rel={ secondaryCtaIsExternalLink ? 'noopener noreferrer' : undefined }
							>
								{ secondaryCtaLabel }
								{ secondaryCtaIsExternalLink && (
									<VisuallyHidden as="span">
										{ __( '(opens in a new tab)', 'jetpack-components' ) }
									</VisuallyHidden>
								) }
							</Button>
						) }
						{ primaryCtaLabel && primaryCtaURL && (
							<Button
								className="upsell-banner--content-cta-button primary"
								href={ primaryCtaURL }
								onClick={ primaryCtaOnClick ?? undefined }
								target={ primaryCtaIsExternalLink ? '_blank' : undefined }
								rel={ primaryCtaIsExternalLink ? 'noopener noreferrer' : undefined }
							>
								{ primaryCtaLabel }
								{ primaryCtaIsExternalLink && (
									<VisuallyHidden as="span">
										{ __( '(opens in a new tab)', 'jetpack-components' ) }
									</VisuallyHidden>
								) }
							</Button>
						) }
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default UpsellBanner;
