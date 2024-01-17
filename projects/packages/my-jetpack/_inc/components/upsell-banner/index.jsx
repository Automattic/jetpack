import { Button } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import React from 'react';
import { CardWrapper } from '../card';

import './style.scss';

/**
 * Upsell banner component.
 *
 * - The primary CTA is the second button, at the right position.
 * - The secondary CTA is the first button, at the left position.
 *
 * @param {object} props - Component props.
 * @returns {object} UpsellBanner React component.
 */
const UpsellBanner = props => {
	// todo: This component could be extracted into js-packages/components. And also the Jetpack Card component
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
		<CardWrapper className="upsell-banner">
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
							onClick={ secondaryCtaOnClick ?? null }
							isExternalLink={ secondaryCtaIsExternalLink }
						>
							{ secondaryCtaLabel }
						</Button>
					) }
					{ primaryCtaLabel && primaryCtaURL && (
						<Button
							className="upsell-banner--content-cta-button primary"
							href={ primaryCtaURL }
							onClick={ primaryCtaOnClick ?? null }
							isExternalLink={ primaryCtaIsExternalLink }
						>
							{ primaryCtaLabel }
						</Button>
					) }
				</div>
			</div>
		</CardWrapper>
	);
};

export default UpsellBanner;
