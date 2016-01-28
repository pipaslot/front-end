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
         * @param {Object} object
         * @returns {Object}
         */
        clone: function (object) {
            if (object) {
                return (JSON.parse(JSON.stringify(object)));
            }
            return object;
        }
    }
})(pipas);