/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

const SideContent = ( {
	isLoadingSideContent,
	illustration,
	illustrationClassName,
	illustrationPath,
	sidebarCard,
	rna,
} ) => {
	const hasIllustration = !! ( illustration || illustrationPath );
	const imgBase = `${ imagePath }recommendations/${ illustration }`;

	if ( isLoadingSideContent ) {
		return <div></div>;
	}

	if ( sidebarCard ) {
		return <div className="jp-recommendations-question__sidebar-card">{ sidebarCard }</div>;
	}

	if ( hasIllustration && ! sidebarCard ) {
		return (
			<div
				className={
					'jp-recommendations-question__illustration-container ' +
					( rna ? 'jp-recommendations-question__illustration-container--rna' : '' )
				}
			>
				{ illustrationPath ? (
					<img
						className={ classNames(
							'jp-recommendations-question__illustration-foreground',
							illustrationClassName
						) }
						src={ `${ imagePath }${ illustrationPath }` }
						alt=""
					/>
				) : (
					<picture className="jp-recommendations-question__illustration-picture">
						<source type="image/webp" srcset={ `${ imgBase }.webp 1x, ${ imgBase }-2x.webp 2x` } />
						<img
							className={ classNames(
								'jp-recommendations-question__illustration-foreground',
								illustrationClassName
							) }
							srcset={ `${ imgBase }-2x.png 2x` }
							src={ `${ imgBase }.png` }
							alt=""
						/>
					</picture>
				) }
			</div>
		);
	}

	return null;
};

const PromptLayout = props => {
	const {
		answer,
		description,
		illustration,
		illustrationPath,
		progressBar,
		question,
		content,
		isNew,
		rna,
		sidebarCard,
		isLoadingSideContent,
	} = props;
	const hasIllustration = !! ( illustration || illustrationPath );

	return (
		<div
			className={ classNames( 'jp-recommendations-question__main', {
				'jp-recommendations-question__main--with-sidebar': hasIllustration || !! sidebarCard,
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
	illustration: PropTypes.string,
	illustrationClassName: PropTypes.string,
	progressBar: PropTypes.element.isRequired,
	question: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
	sidebarCard: PropTypes.element,
	isLoadingSideContent: PropTypes.boolean,
};

export { PromptLayout };
