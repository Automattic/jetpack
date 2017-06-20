<?php

class Jetpack_Data {
	/**
	 * Gets locally stored token
	 *
	 * @return object|false
	 */
	public static function get_access_token( $user_id = false ) {
		if ( $user_id ) {
			if ( !$tokens = Jetpack_Options::get_option( 'user_tokens' ) ) {
				return false;
			}
			if ( $user_id === JETPACK_MASTER_USER ) {
				if ( !$user_id = Jetpack_Options::get_option( 'master_user' ) ) {
					return false;
				}
			}
			if ( !isset( $tokens[$user_id] ) || !$token = $tokens[$user_id] ) {
				return false;
			}
			$token_chunks = explode( '.', $token );
			if ( empty( $token_chunks[1] ) || empty( $token_chunks[2] ) ) {
				return false;
			}
			if ( $user_id != $token_chunks[2] ) {
				return false;
			}
			$token = "{$token_chunks[0]}.{$token_chunks[1]}";
		} else {
			$token = Jetpack_Options::get_option( 'blog_token' );
			if ( empty( $token ) ) {
				return false;
			}
		}

		return (object) array(
			'secret' => $token,
			'external_user_id' => (int) $user_id,
		);
	}

	/**
	 * This function mirrors Jetpack_Data::is_usable_domain() in the WPCOM codebase.
	 *
	 * @param $domain
	 * @param array $extra
	 *
	 * @return bool|WP_Error
	 */
	public static function is_usable_domain( $domain, $extra = array() ) {

		// If it's empty, just fail out.
		if ( ! $domain ) {
			return new WP_Error( 'fail_domain_empty', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it is empty.', 'jetpack' ), $domain ) );
		}

		/**
		 * Skips the usuable domain check when connecting a site.
		 *
		 * Allows site administrators with domains that fail gethostname-based checks to pass the request to WP.com
		 *
		 * @since 4.1.0
		 *
		 * @param bool If the check should be skipped. Default false.
		 */
		if ( apply_filters( 'jetpack_skip_usuable_domain_check', false ) ) {
			return true;
		}

		// None of the explicit localhosts.
		$forbidden_domains = array(
			'wordpress.com',
			'localhost',
			'localhost.localdomain',
			'127.0.0.1',
			'local.wordpress.dev',         // VVV
			'local.wordpress-trunk.dev',   // VVV
			'src.wordpress-develop.dev',   // VVV
			'build.wordpress-develop.dev', // VVV
		);
		if ( in_array( $domain, $forbidden_domains ) ) {
			return new WP_Error( 'fail_domain_forbidden', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it is in the forbidden array.', 'jetpack' ), $domain ) );
		}

		// No .dev or .local domains
		if ( preg_match( '#\.(dev|local)$#i', $domain ) ) {
			return new WP_Error( 'fail_domain_tld', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it uses an invalid top level domain.', 'jetpack' ), $domain ) );
		}

		// No WPCOM subdomains
		if ( preg_match( '#\.wordpress\.com$#i', $domain ) ) {
			return new WP_Error( 'fail_subdomain_wpcom', sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it is a subdomain of WordPress.com.', 'jetpack' ), $domain ) );
		}

		// If PHP was compiled without support for the Filter module (very edge case)
		if ( ! function_exists( 'filter_var' ) ) {
			// Just pass back true for now, and let wpcom sort it out.
			return true;
		}

		// Check the IP to make sure it's pingable. We wrote our own DNS client because we can't rely on local DNS.
		$ips = gethostbyname_timeout( $domain . '.', '8.8.8.8', 10 );

		if ( false === $ips ) {
			return true; // probably a lookup timeout, assume everything's ok
		}

		if ( count( $ips ) == 0 ) {
			return false; // no public A-records
		}

		return true;
	}

	public static function gethostbyname_timeout( $domain, $dns, $timeout = 10 ) {
		// based off of http://www.php.net/manual/en/function.gethostbyaddr.php#46869
		// @ http://www.askapache.com/pub/php/gethostbyaddr.php
		// @ http://www.askapache.com/php/php-fsockopen-dns-udp.html
	
		$data = pack('n6', rand(10, 77), 0x0100, 1, 0, 0, 0);
		foreach (explode('.', $domain) as $bit) {
			$l = strlen($bit);
			$data .= chr($l) . $bit;
		}
		$data .= pack('n2', 1, 1);  // QTYPE=A, QCLASS=IN

		$errno = $errstr = 0;
		$fp = fsockopen( 'udp://' . $dns, 53, $errno, $errstr, $timeout );
		if (!$fp || !is_resource($fp)) return $errno;

		socket_set_timeout( $fp, $timeout );
		$requestsize = fwrite( $fp, $data );

		$max_rx = $requestsize * 3;
		$start = time();
		$response_data = '';
		$responsesize = 0;
		while ( $received < $max_rx && ( ( time() - $start ) < $timeout ) && ( $buf = fread( $fp, 1 ) ) !== false ) {
			$responsesize++;
			$response_data .= $buf;
		}
		$info = stream_get_meta_data( $fp );
		fclose( $fp );

		if ( $info[ 'timed_out' ] ) {
        	echo 'Connection timed out!';
			return false;
		}

		if ( ( time() - $start ) > $timeout ) {
			echo 'Response timed out!';
			return false;
		}

		// read answer header
		$ans_header = unpack( "nid/nspec/nqdcount/nancount/nnscount/narcount", substr( $response_data, 0, 12 ) );

		if ( ! $ans_header['ancount'] ) {
			echo 'No header records!';
			return false; // no answers!
		}

		// skip question part
		$offset = strlen( $domain ) + 4 + 2 + 1; // 4 => QTYPE + QCLASS, 2 => len, 1 => null terminator

		// loop and gather our A-records
		$loops = 0;
		$addresses = array();
		
		do {
			$record_header = unpack("ntype/nclass/Nttl/nlength/C4addr", substr( $response_data, 12 + $offset, 15 ) );
			$offset += $record_header['length'] + 12; // 4 => QTYPE + QCLASS, 4 = TTL, 2 = length

			if ( 1 != $record_header['class'] ) { 
				continue; // for some reason, it wasn't an A record
			}

			$addresses[] =  $record_header['addr1'] . '.' . $record_header['addr2'] . '.' . $record_header['addr3'] . '.' . $record_header['addr4'];
			$loops++;
		} while ( $record_header['length'] != 0 && $loops < 20 );

		return $addresses;
	}

	/**
	 * Returns true if the IP address passed in should not be in a reserved range, even if PHP says that it is.
	 * See: https://bugs.php.net/bug.php?id=66229 and https://github.com/php/php-src/commit/d1314893fd1325ca6aa0831101896e31135a2658
	 *
	 * This function mirrors Jetpack_Data::php_bug_66229_check() in the WPCOM codebase.
	 */
	public static function php_bug_66229_check( $ip ) {
		if ( ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
			return false;
		}

		$ip_arr = array_map( 'intval', explode( '.', $ip ) );

		if ( 128 == $ip_arr[0] && 0 == $ip_arr[1] ) {
			return true;
		}

		if ( 191 == $ip_arr[0] && 255 == $ip_arr[1] ) {
			return true;
		}

		return false;
	}
}
