<?php

$container = require __DIR__ . '/test-app/bootstrap.php';
$container->getService('application')->run();