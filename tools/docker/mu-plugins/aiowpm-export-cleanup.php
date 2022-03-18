<?php

add_filter( 'ai1wm_export', function( $params ) {
	$filename_old = ai1wm_database_path( $params );
	$filename_new = $filename_old . '.new';
	$file_old = fopen( $filename_old, 'r' );
	$file_new = fopen( $filename_new, 'w' );
	if ( false === $file_old || false === $file_new ) {
		return $params;
	}

	$start = 'INSERT INTO `' . ai1wm_servmask_prefix() . 'options` VALUES (';
	$search = '/^' . preg_quote( $start ) . '\d{1,20}' . preg_quote( ",'jetpack_private_options'," ) . '/i';
	while ( ! feof( $file_old ) ) {
		$line = fgets( $file_old );

		if ( 0 === strpos( $line, $start ) && false !== strpos( $line, 'jetpack_private_options' )  && preg_match( $search, $line ) ) {
			continue;
		}

		fwrite( $file_new, $line );
	}

	fclose( $file_old );
	fclose( $file_new );

	unlink( $file_old );
	rename( $filename_new, $filename_old );

	return $params;
}, 210 );
