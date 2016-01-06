/*
 * Error reporting
 */
(function (message) {
    $.nette.ext('error', {
        error: function (jqXHR, status, error, settings) {
            if (status != "abort" && jqXHR.readyState != 0) {
                message.showError("Link has failed to load.");
                console.log(arguments);
            }
        },
        success: function(payload){
            if(payload=="") message.showWarning("No response received");
        }
    });
})(pipas.message);

