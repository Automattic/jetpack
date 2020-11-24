<?php

/**
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */

namespace Twitter\Text;

/**
 * Twitter Text Configuration
 *
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 *
 * @property int $version
 * @property int $maxWeightedTweetLength
 * @property int $scale
 * @property int $defaultWeight
 * @property bool $emojiParsingEnabled
 * @property int $transformedURLLength
 * @property array $ranges
 */
class Configuration
{
    /**
     * configuration from v3.json
     *
     * @var array
     */
    private static $v3Config = array(
        'version' => 3,
        'maxWeightedTweetLength' => 280,
        'scale' => 100,
        'defaultWeight' => 200,
        'emojiParsingEnabled' => true,
        'transformedURLLength' => 23,
        'ranges' => array(
            array(
                'start' => 0,
                'end' => 4351,
                'weight' => 100,
            ),
            array(
                'start' => 8192,
                'end' => 8205,
                'weight' => 100,
            ),
            array(
                'start' => 8208,
                'end' => 8223,
                'weight' => 100,
            ),
            array(
                'start' => 8242,
                'end' => 8247,
                'weight' => 100,
            ),
        ),
    );

    /**
     * configuration from v2.json
     *
     * @var array
     */
    private static $v2Config = array(
        'version' => 2,
        'maxWeightedTweetLength' => 280,
        'scale' => 100,
        'defaultWeight' => 200,
        'transformedURLLength' => 23,
        'ranges' => array(
            array(
                'start' => 0,
                'end' => 4351,
                'weight' => 100,
            ),
            array(
                'start' => 8192,
                'end' => 8205,
                'weight' => 100,
            ),
            array(
                'start' => 8208,
                'end' => 8223,
                'weight' => 100,
            ),
            array(
                'start' => 8242,
                'end' => 8247,
                'weight' => 100,
            ),
        ),
    );

    /**
     * configuration from v1.json
     *
     * @var array
     */
    private static $v1Config = array(
        'version' => 1,
        'maxWeightedTweetLength' => 140,
        'scale' => 1,
        'defaultWeight' => 1,
        'transformedURLLength' => 23,
        'ranges' => array(),
    );

    /**
     * @var array
     */
    private $config;

    /**
     * construct
     *
     * @param array $config
     */
    public function __construct(array $config = null)
    {
        if ($config === null) {
            $config = static::$v3Config;
        }

        $this->config = $config;
    }

    /**
     * property accessor
     *
     * @param string $name
     * @return mixed
     */
    public function __get($name)
    {
        return isset($this->config[$name]) ? $this->config[$name] : null;
    }

    /**
     * convert to array
     *
     * @return array
     */
    public function toArray()
    {
        return $this->config;
    }

    /**
     * Create configuration from json string
     *
     * @param string $json as configuration
     * @return Configuration
     */
    public static function fromJson($json)
    {
        return new Configuration(json_decode($json, true));
    }

    /**
     * Get twitter-text 1.x configuration
     *
     * @return Configuration
     */
    public static function v1()
    {
        return new self(static::$v1Config);
    }

    /**
     * Get twitter-text 2.x configuration
     *
     * @return Configuration
     */
    public static function v2()
    {
        return new self(static::$v2Config);
    }

    /**
     * maxWeightedTweetLength * scale
     *
     * @return int
     */
    public function getScaledMaxWeightedTweetLength()
    {
        return $this->maxWeightedTweetLength * $this->scale;
    }

    /**
     * transformedURLLength * scale
     *
     * @return int
     */
    public function getScaledTransformedURLLength()
    {
        return $this->transformedURLLength * $this->scale;
    }

    /**
     * Get whether emoji parsing is enabled.
     *
     * @return bool `true` if emoji parsing is enabled, otherwise `false`.
     */
    public function getEmojiParsingEnabled()
    {
        return (bool)$this->emojiParsingEnabled;
    }
}
