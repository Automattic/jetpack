<?php

namespace Automattic\Jetpack_Boost\Contracts;

/**
 * Every plugin feature that's large enough
 * to need setup also needs a slug
 */
interface Feature extends Has_Setup, Has_Slug {

}
