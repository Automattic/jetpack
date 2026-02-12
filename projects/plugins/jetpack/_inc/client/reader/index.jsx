import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
import { getModule } from 'state/modules';
import { isModuleFound as isModuleFoundSelector } from 'state/search';
import ReaderDiscover from './reader-discover';
import ReaderModule from './reader-module';

/**
 * Reader Section.
 *
 * @param {object} props - Component props.
 * @return {import('react').Component} Reader settings component.
 */
function Reader( props ) {
	const { active, isModuleFound, searchTerm, blogID } = props;

	if ( ! searchTerm && ! active ) {
		return null;
	}

	const moduleName = 'wpcom-reader';
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
							'Discover and be discovered with the WordPress.com Reader.',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</h2>
			{ foundReader && (
				<>
					<ReaderDiscover moduleName={ moduleName } blogID={ blogID } />
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
