/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Card, CardBody, CardFooter, Dashicon } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useCreateForm from '../hooks/use-create-form';
/**
 * Types
 */
import type { Pattern } from '../types';
import type { KeyboardEvent } from 'react';

const PatternCard = ( { pattern }: { pattern: Pattern } ) => {
	const { openNewForm } = useCreateForm();

	const handleClick = useCallback( () => {
		openNewForm( {
			formPattern: pattern.code,
			analyticsEvent: () => {
				jetpackAnalytics.tracks.recordEvent( 'jetpack_wpa_forms_landing_page_pattern_click', {
					pattern: pattern.code,
				} );
			},
		} );
	}, [ openNewForm, pattern.code ] );

	const handleKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				handleClick();
			}
		},
		[ handleClick ]
	);

	return (
		<Card className="section-patterns__grid-card">
			<CardBody>
				<div
					className="section-patterns__grid-card-body-wrapper"
					onKeyDown={ handleKeyDown }
					onClick={ handleClick }
					role="button"
					tabIndex={ 0 }
				>
					<img
						className="section-patterns__grid-card-image"
						src={ pattern.image }
						alt={ pattern.title }
					/>
				</div>
			</CardBody>
			<CardFooter>
				<div className="section-patterns__grid-card-footer">
					<div className="section-patterns__grid-card-title">
						<h4>{ pattern.title }</h4>
						{ pattern.recommended && (
							<div>
								<span className="section-patterns__grid-card-recommended-badge">
									<Dashicon icon="yes-alt" size={ 16 } />
									{ __( 'Recommended', 'jetpack-forms' ) }
								</span>
							</div>
						) }
					</div>
					<p>{ pattern.description }</p>
				</div>
			</CardFooter>
		</Card>
	);
};

export default PatternCard;
