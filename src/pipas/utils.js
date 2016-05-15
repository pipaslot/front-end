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
        },
        /**
         * Make clone of object
         * @param {Object} obj
         * @returns {Object}
         */
        tryClone: function (obj) {
            if (obj) {
                var newObj = {};
                for (var p in obj) {
                    try {
                        newObj[p] = JSON.parse(JSON.stringify(obj[p]));
                    } catch (e) {
                    }
                }
                return newObj;
            }
            return obj;
        }
    }
})(pipas);