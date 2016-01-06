/**
 * Utilities and helpers
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function (pipas) {
    pipas.utils = {
        /**
         * Make clone of object
         * @param {mixed} object
         * @returns {mixed}
         */
        clone: function (object) {
            if (object) {
                return (JSON.parse(JSON.stringify(object)));
            }
            return object;
        }
    }
})(pipas);