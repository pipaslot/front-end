/*
 * Show spinner for every ajax requests
 *
 * Example for manual calling
 * $.nette.ajax({
 *          spinner:{
 *              show: false     // Disable|enable spinner
 *              parent: "body"  // Parent element jquery selector
 *              id: "myEvent"   // Custom element identifier
 *          }
 *      }
 * });
 *
 * OR shortly
 *
 * $.nette.ajax({
 *          spinner: false
 *      }
 * });
 *
 * For disabling spinner on html elements appends class 'no-spinner' to anchor element: <a href="ajax/request" class="no-spinner" data-spinner="parent identifier">
 */
(function ($, document, window, spinner) {
    $.nette.ext('spinner', {
        init: function () {
            $(document).on('keydown keyup', function (e) {
                if (e.which === 116) {
                    spinner.show("F5");
                    location.reload();
                }
                if (e.which === 82 && e.ctrlKey) {
                    spinner.show("CTRL+F5");
                    location.reload(true);
                }
            });
            // Force hide spinner after initialization
            spinner.cancel();
        },
        prepare: function (settings) {
            this.init(settings);
            if (!settings.spinner.id) {
                settings.spinner.id = "spinner-" + Math.floor((Math.random() * 1000) + 1);
            }
            if (settings.nette) {
                if (settings.nette.el) {
                    var $elm = settings.nette.el;
                    if ($elm) {
                        if ($elm.hasClass("no-spinner")) {
                            settings.spinner.show = false;
                            return;
                        }
                        // Find no-spinner on form
                        if (settings.nette.form && settings.nette.form.hasClass("no-spinner")) {
                            settings.spinner.show = false;
                            return;
                        }

                        // Try find data-spinner
                        var parent = $elm.data("spinner");//On element occurred dispatch (anchor o form button)
                        if (parent) {
                            settings.spinner.parent = parent;
                        } else if (settings.nette.form) {
                            // Try find attribute on form element
                            parent = settings.nette.form.data("spinner");
                            if (parent) {
                                settings.spinner.parent = parent;
                            }
                        }
                    }
                }
            }
        },
        start: function (jqXHR, settings) {
            if (!settings.spinner.show)return;
            spinner.show(settings.spinner.id, settings.spinner.parent);
        },
        complete: function (payload, state, settings) {
            if (!settings.spinner.show)return;
            spinner.hide(settings.spinner.id);
        }
    }, {
        defaults: {
            show: true,
            parent: null,
            id: null
        },
        init: function (settings) {
            var isFalse = settings.spinner === false;
            settings.spinner = $.extend({}, this.defaults, settings.spinner);
            if (isFalse)settings.spinner.show = false;
        },
        disable: function (settings) {
            this.init(settings);
            settings.spinner.show = false;
            return this;
        }

    });
})(jQuery, document, window, pipas.spinner);

