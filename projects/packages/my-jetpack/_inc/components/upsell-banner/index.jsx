import { Gridicon, Button } from '@automattic/jetpack-components';
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
		cta1Target,
		cta1WithIcon,
		cta1OnClick,
		cta2Label,
		cta2URL,
		cta2Target,
		cta2WithIcon,
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
							target={ cta1Target ? cta1Target : '_blank' }
						>
							{ cta1Label }
							{ cta1WithIcon && <Gridicon icon="external" size={ 18 } /> }
						</Button>
					) }
					{ cta2Label && cta2URL && (
						<Button
							className="upsell-banner--content-cta-button secondary"
							href={ cta2URL }
							onClick={ cta2OnClick ?? null }
							rel="noopener noreferrer"
							target={ cta2Target ? cta2Target : '_blank' }
						>
							{ cta2Label }
							{ cta2WithIcon && <Gridicon icon="external" size={ 18 } /> }
						</Button>
					) }
				</div>
			</div>
		</CardWrapper>
	);
};

export default UpsellBanner;
