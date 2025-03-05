<?php
/**
 * Class file for managing the user sessions.
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Sessions
 */
class Sessions {

    public static function hash_token($token) {
        if ( function_exists( 'hash' ) ) {
            return hash( 'sha256', $token );
        } else {
            return sha1( $token );
        }
    }

    public static function get_all($user_id = null) {
        global $wpdb;

        if ($user_id === null) {
            $records = $wpdb->get_results($wpdb->prepare("SELECT * FROM %i WHERE meta_key = 'session_tokens' ORDER BY user_id DESC", $wpdb->usermeta), ARRAY_A);
        } else {
            $records = $wpdb->get_results($wpdb->prepare("SELECT * FROM %i WHERE user_id = %d AND meta_key = 'session_tokens'", $wpdb->usermeta, $user_id), ARRAY_A);
        }

        $sessions = [];

        foreach ( $records as &$record ) {
            if ( ! is_array( $record['meta_value'] ) && is_string( $record['meta_value'] ) ) {
                $record['meta_value'] = maybe_unserialize( $record['meta_value'] );
            }

            foreach($record['meta_value'] as $session_token => $session_data) {
                $session_data['user_id'] = $record['user_id'];
                $session_data['token'] = $session_token;

                $sessions[] = $session_data;
            }
        }

        return $sessions;
    }

    public static function get_by_username_and_token($username, $token) {
        $hashed_token = self::hash_token($token);
        $sessions     = self::get_all( get_user_by('login', $username)->ID );

        foreach ($sessions as $session) {
            if ($hashed_token === $session['token'])
                return $session;
        }

        return null;
    }

}
