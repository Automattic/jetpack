<?php
/**
 * Button Block.
 *
 * @since 8.5.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Button;

const FEATURE_NAME = 'button';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

jetpack_register_block( BLOCK_NAME );
