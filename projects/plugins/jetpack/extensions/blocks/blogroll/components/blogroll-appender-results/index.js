import { useEntityProp } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import './style.scss';

export default function BlogrollAppenderResults( { results, onSelect, searchInput, isLoading } ) {
	const [ siteRecommendations ] = useEntityProp( 'root', 'site', 'Blogroll Recommendations' );

	if ( isLoading ) {
		return (
			<div className="jetpack-blogroll__appender-results">
				<div role="status">{ __( 'Loading…', 'jetpack' ) }</div>
			</div>
		);
	}

	const showPlaceholder = ! searchInput?.trim();

	return (
		<div className="jetpack-blogroll__appender-results">
			{ showPlaceholder && (
				<div
					aria-autocomplete="list"
					className="jetpack-blogroll__appender-result-list-header-text"
				>
					{ __( 'Suggestions', 'jetpack' ) }
				</div>
			) }
			{ results.length === 0 && ! showPlaceholder && (
				<div role="status" className="jetpack-blogroll__appender-no-results-message">
					<span className="jetpack-blogroll__appender-no-results-message-main-text">
						{ __( 'No results', 'jetpack' ) }
					</span>
					<span className="jetpack-blogroll__appender-no-results-message-secondary-text">
						{ sprintf(
							/* translators: %s is search query. */
							__( 'No sites found for %s.', 'jetpack' ),
							searchInput
						) }
					</span>
				</div>
			) }
			{ results.length > 0 && (
				<ul aria-live="polite">
					{ results.map( result => {
						const isDuplicate = siteRecommendations.some( siteRecommendation => {
							return siteRecommendation?.id === result?.blog_id;
						} );

						return (
							<li key={ result.blog_id } className="jetpack-blogroll__appender-result-container">
								<button
									className="jetpack-blogroll__appender-result-title"
									disabled={ isDuplicate }
									onClick={ () => onSelect( result ) }
								>
									<div className="jetpack-blogroll__appender-result-image">
										{ result.site_icon && (
											<img
												src={ result.site_icon }
												alt={ result.name }
												onError={ event => {
													event.target.parentNode.classList.add( 'empty-site-icon' );
												} }
											/>
										) }
									</div>
									<div className="jetpack-blogroll__appender-result-text">
										<span className="jetpack-blogroll__appender-result-title">{ result.name }</span>
										<span className="jetpack-blogroll__appender-result-description">
											{ result.description }
										</span>
									</div>
								</button>
							</li>
						);
					} ) }
				</ul>
			) }
		</div>
	);
}
