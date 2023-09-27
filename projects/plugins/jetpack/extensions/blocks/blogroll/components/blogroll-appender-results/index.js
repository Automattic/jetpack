import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import './style.scss';

export default function BlogrollAppenderResults( { results, showPlaceholder, onSelect } ) {
	return (
		<div className="jetpack-blogroll__appender-results">
			{ showPlaceholder && <div aria-autocomplete="list">{ __( 'Suggestions', 'jetpack' ) }</div> }

			{ results.length === 0 && ! showPlaceholder && (
				<div role="status">{ __( 'No websites found.', 'jetpack' ) }</div>
			) }
			{ results.length > 0 && (
				<ul aria-live="polite">
					{ results.map( result => (
						<li
							key={ result.blog_id }
							className={ classNames( 'jetpack-blogroll__appender-result-container', {
								'is-disabled-result': result?.duplicateRecommendation,
							} ) }
						>
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
