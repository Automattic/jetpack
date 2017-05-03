#!/usr/bin/php
<?php

/**
 * 
 * Usage:
 * php partner-provision-wp.php token_json plan_name
 * 
 */

$token_json = $argv[1];
$plan_name = $argv[2];

echo "Fetching $plan_name with $token_json";