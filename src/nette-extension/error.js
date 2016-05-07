/*
 * Error reporting
 */
(function (message) {
    $.nette.ext('error', {
        prepare: function (settings) {
            this.init(settings);
        },
        error: function (jqXHR, status, error, settings) {
            if (jqXHR.status == 403 || jqXHR.status == 404) {
                message.showError(jqXHR.status + ' - ' + jqXHR.statusText);
            }
            else if (jqXHR.statusText == 'abort') {
                //ignored aborted
            }
            else if (jqXHR.readyState == 0) {
                message.showError("Connection failed. Please check your internet connection.");
            }
            else {
                message.showError("Link has failed to load.");
            }
        },
        success: function (payload, status, jqXHR, settings) {
            if (payload == "" && settings.error.showWarning) message.showWarning("No response received");
        }
    }, {
        defaults: {
            showWarning: true
        },
        init: function (settings) {
            settings.error = $.extend({}, this.defaults, settings.error)
        },
        ignoreWarning: function (settings) {
            this.init(settings);
            settings.error.showWarning = false;
        }
    });
})(pipas.message);

