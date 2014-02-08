<?php
ini_set( 'display_errors', 1 );
class ImportersI18n {
	var $importers_slugs = array('wpcat2tag', 'wordpress', 'utw', 'textpattern', 'stp', 'rss', 'opml', 'movabletype', 'livejournal', 'greymatter', 'dotclear', 'blogware', 'blogger');
	var $username = 'nbachiyski';
	var $plugins_dir = '/www/wp-content-trunk/plugins';
	var $glotpress_source_dir = '/Users/nb/glotpress';
	var $glotpress_api_url = 'http://x/gp/api/projects/importers/%importer%/dev';
	var $glotpress_url = 'http://x/gp/projects/importers/%importer%/dev';	
	var $minimum_percentage = 80;

	function __construct() {
		$this->importers = array_map( create_function( '$x', 'return $x."-importer";' ), $this->importers_slugs);
	}
	
	function s( $importer, $text ) {
		return str_replace( array( '%importer%', '%trunk%' ), array( $importer, "$importer/trunk" ), $text );
	}

	function call_on_all( $command ) {
		foreach( $this->importers as $importer ) {
			system( $this->s( $importer, $command ) );
		}
	}
	
	function ls() {
		$this->call_on_all( "ls %trunk%" );
	}
	
	function command( $command ) {
		$this->call_on_all( $command );
	}
	
	
	function checkout() {
		$this->call_on_all( "svn checkout --username=$this->username  http://plugins.svn.wordpress.org/%importer%" );
	}
	
	function update() {
		$this->call_on_all( "svn up %importer%" );
	}
	
	function rename_main_file() {
		$this->call_on_all( "svn mv %importer%/trunk/*.php %importer%/trunk/%importer%.php" );
	}
	
	function link( $target ) {
	  $this->call_on_all( "ln -s `pwd`/%importer%/trunk $target/%importer%" );	  
	}
	
	function add_load_plugin_textdomain_call() {
		foreach( $this->importers as $importer ) {
			$importer_underscore = str_replace( '-', '_', $importer );
			$main_file_name = "$importer/trunk/$importer.php";
			$main_file = file_get_contents( $main_file_name );
			$main_file .= "
function {$importer_underscore}_init() {
    load_plugin_textdomain( '$importer', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'init', '{$importer_underscore}_init' );
";
			file_put_contents( $main_file_name, $main_file );
		}
	}

	function make_languages_dir() {
		$this->call_on_all( "svn mkdir %importer%/trunk/languages" );
	}
	
	function generate_pot() {
		foreach( $this->importers as $importer ) {
			$old_cwd = getcwd();
			chdir( "$importer/trunk/languages" );
			system( "php ".dirname(__FILE__)."/makepot.php wp-plugin .." );
			chdir( $old_cwd );
		}
	}
	
		
	function diff() {
		$this->call_on_all( "svn diff %trunk%" );
	}
	
	function st() {
		$this->call_on_all( "svn st %trunk%" );
	}
	
	function svn_add_missing() {
		$this->call_on_all( "svn add %trunk%/*" );
		$this->call_on_all( "svn add %trunk%/languages/*" );
	}

	function lint() {
		$this->call_on_all( "php -l %importer% %trunk%/%importer%.php" );
	}

		
	function add_textdomain() {
		$this->call_on_all( "php ".dirname(__FILE__)."/add-textdomain.php -i %importer% %trunk%/%importer%.php" );
	}

	function sync() {
		$this->call_on_all( "cp -R %trunk% $this->plugins_dir/%importer%" );
	}
	
	function commit($message) {
		$this->call_on_all( "svn ci %trunk% -m ".escapeshellarg($message) );
	}
	
	function update_translations() {
		require_once $this->glotpress_source_dir . '/locales/locales.php';
		foreach( $this->importers as $importer ) {
			$project_details_json = file_get_contents( $this->s( $importer, $this->glotpress_api_url ) );
			$project_details = json_decode( $project_details_json );
			if ( !is_object( $project_details ) ) {
				echo "Couldn't get project JSON from GlotPress for $importer.\n";
				continue;
			}			
			foreach( $project_details->translation_sets as $set ) {
				$locale = GP_Locales::by_slug( $set->locale );
				if ( !$locale->wp_locale ) {
					echo "Locale '$set->locale' doesn't have WordPress equivalent.\n";
					continue;
				}
				$po_file = file_get_contents( $this->s( $importer, $this->glotpress_url ) . "/$locale->slug/$set->slug/export-translations" );
				if ( !$po_file ) {
					echo "Couldn't download translation for '$importer' in '$set->locale'.\n";
					continue;
				}				
				$po_path = $this->s( $importer, "%trunk%/languages/$locale->wp_locale.po" );				
				$mo_path = str_replace( '.po', '.mo', $po_path );
				file_put_contents( $po_path, $po_file );
				$msgfmt_output = `msgfmt --statistics $po_path -o $mo_path 2>&1`;
				preg_match( '/(\d+) translated messages(?:\.|, (\d+) untranslated messages)/', $msgfmt_output, $matches );
				if ( isset( $matches[2] ) )  {
					$translated_percentage = $matches[1] / ( $matches[1] + $matches[2] ) * 100;
					if ( $translated_percentage < $this->minimum_percentage ) {
						unlink( $po_path );
						unlink( $mo_path );
						echo "Translation of '$importer' in '$locale->slug' has only $translated_percentage% translated, $this->minimum_percentage% are required.\n";
					}
				}
			}
		}
	}
	
	function create_glotpress_projects( $parent_project_path ) {
		require_once $this->glotpress_source_dir . '/gp-load.php';
		require_once dirname(__FILE__) . '/makepot.php';
		$makepot = new MakePOT;
		$parent_project = GP::$project->by_path( $parent_project_path );
		if ( !$parent_project ) {
			echo "Couldn't find project with path $parent_project_path.\n";
			return;
		}
		foreach( $this->importers as $importer ) {
			$source = $makepot->get_first_lines( $this->s( $importer, '%trunk%/%importer%.php' ), $makepot->max_header_lines);
			if ( !GP::$project->by_path( "$parent_project_path/$importer") ) {
				$importer_project = GP::$project->create_and_select(array(
					'name' => $makepot->get_addon_header('Plugin Name', $source),
					'slug' => $importer,
					'description' => $makepot->get_addon_header('Description', $source),
					'parent_project_id' => $parent_project->id,
				));				
			} else {
				echo "Project $parent_project_path/$importer already exists.\n";
			}
			if ( !GP::$project->by_path( "$parent_project_path/$importer/dev") ) {
				$trunk_project = GP::$project->create_and_select(array(
					'name' => 'Development (trunk)',
					'slug' => 'dev',
					'description' => 'Development version of ' . $makepot->get_addon_header('Plugin Name', $source),
					'parent_project_id' => $importer_project->id,
					'source_url_template' => $this->s($importer, "http://plugins.trac.wordpress.org/browser/%importer%/trunk/%file%#L%line%"),
				));
			} else {
				echo "Project $parent_project_path/$importer/dev already exists.\n";
			}			
		}
	}
	
	function import_glotpress_originals( $parent_project_path ) {
		foreach( $this->importers as $importer ) {
			system( $this->s( $importer, "php $this->glotpress_source_dir/scripts/import-originals.php -p $parent_project_path/%importer%/dev -f %trunk%/languages/%importer%.pot" ) );
		}
	}
	
	function line_of_text( $line ) {
		foreach( $this->importers as $importer ) {
			echo $this->s( $importer, $line ) . "\n";
		}
	}
}
$importers_i18n = new ImportersI18n;
call_user_func_array( array( &$importers_i18n, $argv[1] ), array_slice( $argv, 2 ) );
