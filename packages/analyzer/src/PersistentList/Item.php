<?php

namespace Automattic\Jetpack\Analyzer\PersistentList;

abstract class Item {
	abstract function to_csv_array();
}