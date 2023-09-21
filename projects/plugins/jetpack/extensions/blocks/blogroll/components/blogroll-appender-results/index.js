import { __ } from '@wordpress/i18n';
import './style.scss';

export default function BlogrollAppenderResults( { results, showPlaceholder, onSelect } ) {
	return (
		<div className="jetpack-blogroll__appender-results">
			{ showPlaceholder && <div>{ __( 'Suggestions', 'jetpack' ) }</div> }
			{ results.length === 0 && ! showPlaceholder && (
				<div>{ __( 'No websites found.', 'jetpack' ) }</div>
			) }
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
		</div>
	);
}
