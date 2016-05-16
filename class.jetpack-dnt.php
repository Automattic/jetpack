<?php
class Jetpack_DNT {
        static function is_dnt_enabled() {
                foreach ($_SERVER as $name => $value) {
                        if ( strtolower( $name ) == 'http_dnt' && $value == 1 ) {
                                return true;
                        }
                }

                return false;
        }
}
