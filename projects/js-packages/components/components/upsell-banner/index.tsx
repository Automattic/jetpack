import { Button } from '@automattic/jetpack-components';
import { Card, CardBody } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import React from 'react';
import { UpsellBannerProps } from './types';

import './style.scss';

/**
 * Upsell banner component.
 *
 * - The primary CTA is the second button, at the right position.
 * - The secondary CTA is the first button, at the left position.
 *
 * @param {UpsellBannerProps} props - Component props.
 * @returns {React.ReactNode} - UpsellBanner component.
 */
const UpsellBanner: React.FC< UpsellBannerProps > = props => {
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
