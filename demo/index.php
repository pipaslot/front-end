<?php
require __DIR__ . '/vendor/autoload.php';

$configurator = new Nette\Configurator;
$configurator->enableDebugger(__DIR__ . '/log');
$configurator->setDebugMode(false);
$configurator->setTempDirectory(__DIR__ . '/temp');
$configurator->addConfig(__DIR__ . '/config.neon');

$container = $configurator->createContainer();
$container->getService('application')->run();