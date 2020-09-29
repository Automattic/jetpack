<?php

# Set up error reporting:
error_reporting(E_ALL | E_STRICT | E_DEPRECATED);

# Set default timezone to hide warnings:
date_default_timezone_set('Europe/London');

# Set encoding for manipulation of multi byte strings:
mb_internal_encoding('UTF-8');

# Set up path variables.
$DATA = dirname(__DIR__) . '/vendor/twitter/twitter-text/conformance';
if (!defined('DATA')) {
    define('DATA', $DATA);
}
$CONFIG = dirname(__DIR__) . '/vendor/twitter/twitter-text/config';
if (!defined('CONFIG')) {
    define('CONFIG', $CONFIG);
}

# Include required classes.
require dirname(__DIR__) . '/vendor/autoload.php';

// for PHPUnit < 5.7
if (!class_exists('\PHPUnit\Framework\TestCase')) {
    class_alias('\PHPUnit_Framework_TestCase', '\PHPUnit\Framework\TestCase');
}
