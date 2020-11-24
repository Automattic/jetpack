<?php

$rootDir = dirname(__DIR__);
require $rootDir . '/vendor/autoload.php';

use Symfony\Component\Yaml\Yaml;

$classFile = $rootDir . '/lib/Twitter/Text/TldLists.php';
$yamlParseMethod = 'parseFile';
if (!method_exists('\Symfony\Component\Yaml\Yaml', $yamlParseMethod)) {
    $yamlParseMethod = 'parse';
}
$tlds = Yaml::$yamlParseMethod($rootDir . '/vendor/twitter/twitter-text/conformance/tld_lib.yml');

ob_start();
echo "<?php\n";
?>

/**
 * @author     Takashi Nojima
 * @copyright  Copyright <?= date('Y') ?>, Takashi Nojima
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text;

/**
 * TLD Lists
 */
final class TldLists
{
    /**
     * gTLDs
     *
     * @var array
     */
    private static $gTLDs = array(
<?php foreach ($tlds['generic'] as $tld) : ?>
        '<?= $tld ?>',
<?php endforeach; ?>
    );

    /**
     * gTLDs
     *
     * @var array
     */
    private static $ccTLDs = array(
<?php foreach ($tlds['country'] as $tld) : ?>
        '<?= $tld ?>',
<?php endforeach; ?>
    );

    /**
     * get valid gTLD regexp
     *
     * @staticvar string $regex
     * @return string
     */
    final public static function getValidGTLD()
    {
        static $regex;

        if (!empty($regex)) {
            return $regex;
        }

        $gTLD = implode('|', static::$gTLDs);
        $regex = '(?:(?:' . $gTLD . ')(?=[^0-9a-z@]|$))';

        return $regex;
    }

    /**
     * get valid ccTLD regexp
     *
     * @staticvar string $regex
     * @return string
     */
    final public static function getValidCcTLD()
    {
        static $regex;

        if (!empty($regex)) {
            return $regex;
        }

        $ccTLD = implode('|', static::$ccTLDs);
        $regex = '(?:(?:' . $ccTLD . ')(?=[^0-9a-z@]|$))';

        return $regex;
    }
}
<?php
$content = ob_get_clean();

echo $content;

file_put_contents($classFile, $content);
