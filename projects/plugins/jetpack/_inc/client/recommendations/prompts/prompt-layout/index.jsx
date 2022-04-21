/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

const SideContent = ( { isLoadingSideContent, illustrationPath, question, sidebarCard, rna } ) => {
	if ( isLoadingSideContent ) {
		return <div></div>;
	}

	if ( sidebarCard ) {
		return <div className="jp-recommendations-question__sidebar-card">{ sidebarCard }</div>;
	}

	if ( illustrationPath && ! sidebarCard ) {
		return (
			<div
				className={
					'jp-recommendations-question__illustration-container ' +
					( rna ? 'jp-recommendations-question__illustration-container--rna' : '' )
				}
			>
				{ ! rna && (
					<img
						className="jp-recommendations-question__illustration-background"
						src={ imagePath + 'recommendations/background.svg' }
						alt={ __(
							'An illustration of a browser window used as the container to visually represent the current question.',
							'jetpack'
						) }
					/>
				) }
				<img
					className="jp-recommendations-question__illustration-foreground"
					src={ imagePath + illustrationPath }
					alt={ sprintf(
						/* translators: %s: Name of the current Jetpack Assistant question (read: step). */
						__( 'Illustration used to visually represent the current question: %s.', 'jetpack' ),
						question
					) }
				/>
			</div>
		);
	}

	return null;
};

const PromptLayout = props => {
	const {
		answer,
		description,
		illustrationPath,
		progressBar,
		question,
		content,
		isNew,
		rna,
		sidebarCard,
		isLoadingSideContent,
	} = props;

	return (
		<div
			className={ classNames( 'jp-recommendations-question__main', {
				'jp-recommendations-question__main--with-sidebar': !! illustrationPath || !! sidebarCard,
				'jp-recommendations-question__main--with-illustration':
					! isLoadingSideContent && !! illustrationPath,
				'jp-recommendations-question__main--with-illustration--rna': !! illustrationPath && !! rna,
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
			<SideContent { ...props } />
		</div>
	);
};

PromptLayout.propTypes = {
	answer: PropTypes.element.isRequired,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
	illustrationPath: PropTypes.string,
	progressBar: PropTypes.element.isRequired,
	question: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
	sidebarCard: PropTypes.element,
	isLoadingSideContent: PropTypes.boolean,
};

export { PromptLayout };
