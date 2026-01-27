import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
import { getModule } from 'state/modules';
import { isModuleFound as isModuleFoundSelector } from 'state/search';
import ReaderModule from './reader-module';

/**
 * Reader Section.
 *
 * @param {object} props - Component props.
 * @return {import('react').Component} Reader settings component.
 */
function Reader( props ) {
	const { active, isModuleFound, searchTerm } = props;

	if ( ! searchTerm && ! active ) {
		return null;
	}

	const moduleName = 'reader';
	const foundReader = isModuleFound( moduleName );

	if ( ! foundReader ) {
		return null;
	}

	return (
		<div>
			<QuerySite />
			<h1 className="screen-reader-text">{ __( 'Jetpack Reader Settings', 'jetpack' ) }</h1>
			<h2 className="jp-settings__section-title">
				{ searchTerm
					? __( 'Reader', 'jetpack' )
					: __(
							'Stay up to date with your favorite sites and find new ones with the WordPress.com Reader.',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</h2>
			{ foundReader && (
				<>
					<ReaderModule moduleName={ moduleName } />
				</>
			) }
		</div>
	);
}

export default connect( state => ( {
	module: module_name => getModule( state, module_name ),
	isModuleFound: module_name => isModuleFoundSelector( state, module_name ),
} ) )( Reader );
