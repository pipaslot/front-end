/*
 * Manage request an abort duplicated
 *
 * Manual calling:
 * $.nette.ajax({
 *          // True             - aborts all previous requests
 *          // False            - enable call same request multiple
 *          // Undefined||Null  - abort same previous request
 *          // string           - abort all previous requests with same identifier
 *          unique: false
 *      }
 * }); *
 *
 * Element attributes and classes: *
 * Class:       "no-unique"                 - disable aborting
 * Class:       "unique"                    - abort all previous requests
 * Attribute:   data-unique = "identifier"  - abort all previous request with same identifier
 *
 * Abort is called to if ESC is pressed
 */
(function ($, document,pipas) {
    $.nette.ext('unique', false);
    $.nette.ext('unique', {
        init: function () {
            $(document).keyup(function (e) {
                //ESC press
                if (e.keyCode == 27) {
                    $.nette.ext('unique').abortAll();
                }
            });
        },
        prepare: function (settings) {
            var identifier;
            if (settings.unique === undefined)settings.unique = null;
            if (settings.nette && settings.nette.el) {
                var $elm = settings.nette.el;
                if ($elm) {
                    identifier = $elm.data("unique");
                    if ($elm.hasClass("no-unique")) {
                        settings.unique = false;
                    } else if ($elm.hasClass("unique")) {
                        settings.unique = true;
                    }
                }
            }
            //set key
            if (typeof settings.unique == "string") {
                settings.uniqueKey = settings.unique;
                settings.unique = null;
            }
            else if (identifier)settings.uniqueKey = identifier;
            else settings.uniqueKey = settings.url;
        },
        before: function (xhr, settings) {
            if (settings.unique === null) {
                this.abortBy(settings.uniqueKey);
            }
            else if (settings.unique === true) {
                this.abortAll();
            }
            if (this.XHRs[settings.uniqueKey] == undefined)this.XHRs[settings.uniqueKey] = [];
            this.XHRs[settings.uniqueKey].push([xhr]);//xhr must be surrounded by one extra array, because in normal way it occur mistakes during abortion (it aborting only even requests)
        },
        complete: function (jqXHR, status, settings) {
            if (this.XHRs[settings.uniqueKey]) {
                var index = this.XHRs[settings.uniqueKey].indexOf(jqXHR);
                if (index >= 0)this.XHRs[settings.uniqueKey].splice(index, 1);
                if (Object.keys(this.XHRs[settings.uniqueKey]).length == 0) delete this.XHRs[settings.uniqueKey];
            }
        }
    }, {
        //list of grouped xhrs
        XHRs: {},
        abortAll: function () {
            for (var id in this.XHRs) {
                this.abortBy(id);
            }
        },
        abortBy: function (identifier) {
            if (this.XHRs[identifier]) {
                for (var key in this.XHRs[identifier]) {
                    this.XHRs[identifier][key][0].abort();
                }
                delete this.XHRs[identifier];
            }
        }
    });
})(jQuery, document,pipas);
