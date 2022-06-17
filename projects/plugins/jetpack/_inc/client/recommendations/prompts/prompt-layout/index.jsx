import { imagePath } from 'constants/urls';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { isFetchingIntroOffers } from 'state/intro-offers';
import { isFetchingRecommendationsProductSuggestions } from 'state/recommendations';
import { isFetchingSiteDiscount } from 'state/site/reducer';

import './style.scss';

const SideContent = ( { isLoading, illustration, illustrationClassName, sidebarCard } ) => {
	const imgBase = `${ imagePath }recommendations/${ illustration }`;

	if ( isLoading ) {
		return null;
	}

	if ( sidebarCard ) {
		return <div className="jp-recommendations-question__sidebar-card">{ sidebarCard }</div>;
	}

	if ( illustration ) {
		return (
			<div className="jp-recommendations-question__illustration-container">
				<picture className="jp-recommendations-question__illustration-picture">
					<source type="image/webp" srcSet={ `${ imgBase }.webp 1x, ${ imgBase }-2x.webp 2x` } />
					<img
						className={ classNames(
							'jp-recommendations-question__illustration',
							illustrationClassName
						) }
						srcSet={ `${ imgBase }-2x.png 2x` }
						src={ `${ imgBase }.png` }
						alt=""
					/>
				</picture>
			</div>
		);
	}

	return null;
};

const PromptLayoutComponent = props => {
	const {
		answer,
		description,
		illustration,
		progressBar,
		question,
		content,
		isNew,
		sidebarCard,
	} = props;

	return (
		<div
			className={ classNames( 'jp-recommendations-question__main', {
				'jp-recommendations-question__main--with-sidebar': !! illustration || !! sidebarCard,
			} ) }
		>
			<div className="jp-recommendations-question__content">
				{ ( isNew || progressBar ) && (
					<div className="jp-recommendations-question__progress-bar-wrap">
						{ isNew && (
							<span className="jp-recommendations__new-badge">{ __( 'New', 'jetpack' ) }</span>
						) }
						<div className="jp-recommendations-question__progress-bar">{ progressBar }</div>
					</div>
				) }
				<h1 className="jp-recommendations-question__question">{ question }</h1>
				<p className="jp-recommendations-question__description">{ description }</p>
				{ content }
				<div className="jp-recommendations-question__answer">{ answer }</div>
			</div>
			<div className="jp-recommendations-question__sidebar">
				<SideContent { ...props } />
			</div>
		</div>
	);
};

PromptLayoutComponent.propTypes = {
	answer: PropTypes.element.isRequired,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
	illustration: PropTypes.string,
	illustrationClassName: PropTypes.string,
	progressBar: PropTypes.element.isRequired,
	question: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
	content: PropTypes.element,
	sidebarCard: PropTypes.element,
	isNew: PropTypes.bool,
	isLoading: PropTypes.bool,
};

const PromptLayout = connect( state => ( {
	isLoading:
		isFetchingSiteDiscount( state ) ||
		isFetchingRecommendationsProductSuggestions( state ) ||
		isFetchingIntroOffers( state ),
} ) )( PromptLayoutComponent );
export { PromptLayout };
