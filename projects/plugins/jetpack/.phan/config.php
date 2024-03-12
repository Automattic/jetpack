<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

$config = make_phan_config( dirname( __DIR__ ) );

// This file breaks analysis, Phan gets lost recursing in trying to figure out some types.
// @todo Add type declarations so Phan won't have to do it itself. Or update to a modern less lib.
$config['exclude_analysis_directory_list'][] = './modules/custom-css/custom-css/preprocessors/lessc.inc.php';

return $config;
