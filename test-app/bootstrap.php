<?php

require __DIR__ . '/vendor/autoload.php';

$configurator = new Nette\Configurator;

$configurator->enableDebugger(__DIR__ . '/log');

$configurator->setTempDirectory(__DIR__ . '/temp');

$configurator->addConfig(__DIR__ . '/config.neon');

return $configurator->createContainer();
