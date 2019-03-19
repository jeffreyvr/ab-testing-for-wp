<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit3ca069ed2eeb7caff92dca41e2d25775
{
    public static $classMap = array (
        'ABTestingForWP\\ABTestContentParser' => __DIR__ . '/../..' . '/src/ab-test-content-parser.php',
        'ABTestingForWP\\ABTestManager' => __DIR__ . '/../..' . '/src/ab-test-manager.php',
        'ABTestingForWP\\ABTestStats' => __DIR__ . '/../..' . '/src/ab-test-stats.php',
        'ABTestingForWP\\ABTestTracking' => __DIR__ . '/../..' . '/src/ab-test-tracking.php',
        'ABTestingForWP\\AdminPage' => __DIR__ . '/../..' . '/src/admin-page.php',
        'ABTestingForWP\\BlockRenderer' => __DIR__ . '/../..' . '/src/block-renderer.php',
        'ABTestingForWP\\Installer' => __DIR__ . '/../..' . '/src/installer.php',
        'ABTestingForWP\\RegisterGutenbergBlocks' => __DIR__ . '/../..' . '/src/register-gutenberg-blocks.php',
        'ABTestingForWP\\RegisterREST' => __DIR__ . '/../..' . '/src/register-rest.php',
        'ABTestingForWP\\RegisterRenderScripts' => __DIR__ . '/../..' . '/src/register-render-scripts.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->classMap = ComposerStaticInit3ca069ed2eeb7caff92dca41e2d25775::$classMap;

        }, null, ClassLoader::class);
    }
}