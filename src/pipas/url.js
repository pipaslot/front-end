/**
 * URL address management
 *
 * @copyright Copyright (c) 2015 Petr štipek
 * @license MIT
 */
(function (history, pipas) {
    pipas.url = {
        stateTypeName: "pipasAjax",
        cleanedParameters: ["_fid"],
        history: [],
        /**
         * Cleanse the URL from unnecessary parameters
         * @param {string} url
         * @returns {string}
         */
        clean: function (url) {
            for (var key in this.cleanedParameters) {

                url = this.remove(url, this.cleanedParameters[key]);
            }
            return url;
        },
        /**
         * Append new parameter to url or override old value
         * @param {string} url
         * @param {string} param
         * @param {string} value
         * @returns {Boolean|string}
         */
        append: function (url, param, value) {
            var params = this.separeParams(url);
            params[param] = value;
            return this.getPureUrl(url) + "?" + this.joinParams(params);
        },
        /**
         * Appends parameters to url from another url
         * @param {string} url
         * @param {string} data
         * @returns {Boolean|string}
         */
        appendData: function (url, data) {
            var params = this.separeParams(url);
            var array2 = this.separeParams(decodeURI(data));

            for (var i in array2) {
                params[i] = array2[i];
            }
            url = this.getPureUrl(url);
            if (Object.keys(params).length === 0)
                return url;
            return url + "?" + this.joinParams(params);
        },
        /**
         * Search parameter value
         * @param {string} url
         * @param {string} param
         * @returns {null|string}
         */
        search: function (url, param) {
            if (typeof url === 'string' && typeof param === 'string') {
                var params = this.separeParams(url);
                for (var i in params) {
                    if (i === param)
                        return params[i];
                }
            }
            return null;
        },
        /**
         * Remove parameter from URL
         * @param {string} url
         * @param {string} param
         * @returns {string}
         */
        remove: function (url, param) {
            if (typeof url === 'string' && typeof param === 'string') {
                var params = this.separeParams(url);
                for (var i in params) {
                    if (i === param) {
                        delete params[i];
                    }
                }
                if (Object.keys(params).length === 0)
                    return this.getPureUrl(url);
                url = this.getPureUrl(url) + "?" + this.joinParams(params);
            }
            return url;
        },
        /**
         * Change current url address to defined
         * @param {string} url
         * @returns {boolean} If current url is same as requested, returns false
         */
        changeTo: function (url) {
            if (!url) {
                url = "/";
            } else {
                url = this.clean(url);
            }
            var last = this.history.pop();
            if (last !== url) {
                this.history.push(last);
            }
            this.history.push(url);
            if (history && history.pushState) {

                if (history.state && history.state.url && history.state.url === url)
                    return false;
                history.pushState({
                    type: this.stateTypeName,
                    url: url
                }, null, url);

                return true;
            }
            else {
                console.error("Can not write URL");
            }
            return false;
        },
        /**
         * finds the parameter value in the data, which are acquired from GET
         * @param {string} getData
         * @param {string} param
         * @returns {string|bool} String or False
         */
        searchFromData: function (getData, param) {
            getData = decodeURI(getData);
            if (typeof getData === 'string' && typeof param === 'string') {
                var pair;
                var b = getData.split("&");
                for (var i in b) {
                    pair = b[i].split("=");
                    if (pair[0] === param) {
                        return pair[1];
                    }
                }
            }
            return false;
        },
        /**
         * Returns URL without parameters
         * @param {string} url
         * @returns {string}
         */
        getPureUrl: function (url) {
            if (typeof url === 'string') {
                var base = url.split("?");
                return base[0];
            }
            return "";
        },
        /**
         * Gets parameters from URL as array
         * @param {string} url
         * @returns {Array} asociativní pole
         */
        separeParams: function (url) {
            var list = [];
            if (typeof url === 'string') {
                var base = url.split("?");
                var params = base[base.length - 1];
                var pair, pairs = params.split("&");
                var ai = 0;//array iterator
                for (var i in pairs) {
                    if (pairs[i] !== "") {
                        pair = pairs[i].split("=");
                        if (pair[1]) {
                            if (pair[0].indexOf("[]") !== -1) {
                                //parameter is number, then from 'param[]' will be 'param[number]'
                                pair[0] = pair[0].substring(0, pair[0].length - 2) + "[" + ai + "]";
                                ai++;
                            }
                            list[pair[0]] = pair[1];
                        }
                    }
                }
            }
            return list;
        },
        /**
         * Join parameters to GET string
         * @param {Array} params
         * @returns {string}
         */
        joinParams: function (params) {
            var url = "";
            if (Array.isArray(params)) {
                for (var i in params) {
                    if (url !== "")
                        url += "&";
                    url += i + "=" + params[i];
                }
            }
            return url;
        },
        /**
         * Current document URL
         * @returns {string}
         */
        getCurrent: function () {
            return document.location.href;
        }

    };
    if (!history.state) {
        history.replaceState({
            type: pipas.url.stateTypeName
        }, null, document.location);
    }
})(history, pipas);