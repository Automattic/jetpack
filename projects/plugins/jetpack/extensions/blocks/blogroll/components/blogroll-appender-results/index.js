import { __, sprintf } from '@wordpress/i18n';
import './style.scss';

export default function BlogrollAppenderResults( { results, onSelect, searchInput, isLoading } ) {
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
					{ results.map( result => (
						<li key={ result.blog_id }>
							<a
								className="jetpack-blogroll__appender-result-title"
								href="#"
								onClick={ () => onSelect( result ) }
							>
								<div className="jetpack-blogroll__appender-result-image">
									{ result.site_icon && <img src={ result.site_icon } alt={ result.name } /> }
								</div>

								<div className="jetpack-blogroll__appender-result-text">
									<span className="jetpack-blogroll__appender-result-title">{ result.name }</span>
									<span className="jetpack-blogroll__appender-result-description">
										{ result.description }
									</span>
								</div>
							</a>
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
