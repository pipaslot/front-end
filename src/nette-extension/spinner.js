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
 * For disabling spinner on html elements appends class 'no-spinner' to anchor element: <a href="ajax/request" class="no-spinner" data-spinner="parent identifier">
 */
(function ($, document, window, spinner) {
    $.nette.ext('spinner', {
        init: function () {
            $(document).on('keydown keyup', function (e) {
                if (e.which === 116) {
                    spinner.show("F5");
                }
                if (e.which === 82 && e.ctrlKey) {
                    spinner.show("CTRL+F5");
                }
            });
            $(window).on("beforeunload", function () {
                spinner.show("refreshDocument");
            });
            // Force hide spinner after initialization
            spinner.cancel();
        },
        prepare: function (settings) {
            settings.spinner = $.extend({}, this.defaults, settings.spinner);
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
                        // Try find data-spinner
                        var parent = $elm.data("spinner");//On element occurred dispatch (anchor o form button)
                        console.log($elm, parent);
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
        }
    });
})(jQuery, document, window, pipas.spinner);

