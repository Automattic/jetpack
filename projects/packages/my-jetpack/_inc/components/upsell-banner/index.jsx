import { Button } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { CardWrapper } from '../card';

import './style.scss';

/**
 * Upsell banner component.
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
		cta1Label,
		cta1URL,
		cta1IsExternalLink,
		cta1OnClick,
		cta2Label,
		cta2URL,
		cta2IsExternalLink,
		cta2OnClick,
	} = props;

	return (
		<CardWrapper className="upsell-banner">
			{ icon && (
				<div className="upsell-banner--icon">
					<img
						src={ icon }
						alt={ __( 'A control panel representing Jetpack Manage', 'jetpack-my-jetpack' ) }
					/>
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
					{ cta1Label && cta1URL && (
						<Button
							className="upsell-banner--content-cta-button primary"
							href={ cta1URL }
							onClick={ cta1OnClick ?? null }
							isExternalLink={ cta1IsExternalLink }
						>
							{ cta1Label }
						</Button>
					) }
					{ cta2Label && cta2URL && (
						<Button
							className="upsell-banner--content-cta-button secondary"
							href={ cta2URL }
							onClick={ cta2OnClick ?? null }
							rel="noopener noreferrer"
							isExternalLink={ cta2IsExternalLink }
						>
							{ cta2Label }
						</Button>
					) }
				</div>
			</div>
		</CardWrapper>
	);
};

export default UpsellBanner;
