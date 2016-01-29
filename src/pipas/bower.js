/**
 * Bower dependency loading
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    /**
     * @deprecated
     * @type {bower}
     */
    pipas.bower = new function () {
        var inner = {
            directory: "bower_components"
        };

        /**
         * Get / Set path to bower from document root
         * @param path
         * @returns {string}
         */
        this.directory = function (path) {
            if (path != undefined) {
                inner.directory = path.replace(/^\/|\/$/g, '');
            }
            return inner.directory;
        };
        /**
         * Load files from paths and run callbacks. Use caching
         * @param {string|Array}urlList
         * @param callback
         * @param context Callback context
         */
        this.get = function (urlList, callback, context) {
            pipas.getDependencies(pipas.applyBasePathForList(urlList, inner.directory), callback, context);
        };

    };
})(jQuery, pipas);