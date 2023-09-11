<?php

$y = array( 'a', 'b', 'c' );
if ( 1 === $_SERVER['argc'] ) {
    delete( $y[0] );
    echo "ok\n";
}
