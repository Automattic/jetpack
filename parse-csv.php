<?php
$plugin_url = 'https://wpdirectory.net/api/v1/search/summary/';
$theme_url = '';

$file = fopen('/Users/michael/Downloads/dna.csv', 'r');
$x = [];
$themes = [];
$theme_slugs = [];
$slugs = [];
while (($line = fgetcsv($file)) !== FALSE) {
	if ( 'Link' == $line[6] ) {
		continue;
	}

	if ( ! empty( $line[5] ) ) {
		$api_slug = substr( $line[6], strrpos( $line[6], '/') + 1);
		echo "Calling " . $plugin_url . $api_slug . "\n";
		$response = fetch( $plugin_url . $api_slug );
		$plugins = json_decode( $response, true );
		foreach( $plugins['results'] as $plugin ) {
			$slugs[$plugin['slug']] = $plugin['active_installs' ];
		}
		$x[] = [
			$line[2],
			$line[3],
			$line[4],
			$plugins
		];
	}

	if ( ! empty( $line[7] ) ) {
		$api_slug = substr( $line[8], strrpos( $line[8], '/') + 1);
		echo "Calling " . $plugin_url . $api_slug . "\n";
		$response = fetch( $plugin_url . $api_slug );
		$plugins = json_decode( $response, true );
		foreach( $plugins['results'] as $plugin ) {
			$theme_slugs[] = $plugin['slug'];
		}
		$themes[] = [
			$line[2],
			$line[3],
			$line[4],
			$plugins
		];
	}

}
fclose($file);

arsort( $slugs );
//arsort( $slugs);
//print_r( $x);
print_r( $slugs );
//print_r( array_unique( $theme_slugs) );
//print_r( $themes);

function fetch( $url ) {
	$agent= 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.0.3705; .NET CLR 1.1.4322)';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_USERAGENT, $agent);
	curl_setopt($ch, CURLOPT_URL,$url);
	$result=curl_exec($ch);
	return $result;
}