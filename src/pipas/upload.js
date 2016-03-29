/**
 * Progress bar
 *
 * @copyright Copyright (c) 2016 Petr štipek
 * @license MIT
 */
(function ($, pipas) {
    if (!pipas.progress)console.error("Progress must be declared before file upload", pipas);
    pipas.upload = {
        text: {
            upload: "Upload",
            processing: "Processing"
        },
        /**
         *
         * @param fileInputSelector
         * @param uploadUrl
         * @returns {pipas.upload.UploadControl}
         */
        create: function (fileInputSelector, uploadUrl) {
            return new pipas.upload.UploadControl(fileInputSelector, uploadUrl);
        },
        UploadControl: function (elementSelector, uploadUrl) {
            /** @type {Array} Callback called after upload */
            this.onUpload = [];
            /** @type {Array} Callback called after processing */
            this.onSuccess = [];
            var self = this;
            var uploadProgress, processingProgress;
            var callSuccess = function () {
                for (var i in self.onSuccess) {
                    self.onSuccess[i].call(this, self);
                }
            };
            var getStatus = function () {
                if (!self.processingStatusUrl) {
                    callSuccess();
                    return;
                }
                if (!processingProgress) {
                    processingProgress = pipas.progress.show(self.progressContainerId);
                    processingProgress.setLabel(pipas.upload.text.processing);
                }
                $.ajax({
                    type: 'GET',
                    url: self.processingStatusUrl,
                    redirect: false,
                    spinner: false,
                    async: true,
                    success: function (payload) {
                        if (typeof payload == 'string') {
                            processingProgress.setValue(payload);
                        } else {
                            processingProgress.setValue(payload.status);
                        }
                        if (!processingProgress.isSuccess()) {
                            setTimeout(function () {
                                getStatus();
                            }, 300);
                        } else {
                            callSuccess();
                        }
                    }
                });
            };
            /**
             * Detach attached event to element
             */
            this.destroy = function () {
                this.element.off('change', onChange);
            };
            var onChange = function () {
                if (self.element.get(0).files.length > 0) {
                    var ajaxData = new FormData();
                    ajaxData.append('action', 'uploadImages');
                    var iterator = 0;
                    var inputName = self.element.attr("name") ? self.element.attr("name").replace(/[[\]]/g, '') : "photo";
                    $.each(self.element, function (i, obj) {
                        $.each(obj.files, function (j, file) {
                            ajaxData.append(inputName + '[' + iterator + ']', file);
                            iterator++;
                        })
                    });
                    var progress;
                    $.nette.ajax({
                        redirect: false,
                        spinner: false,
                        url: uploadUrl,
                        type: 'POST',
                        async: true,
                        data: ajaxData,
                        dataType: 'json',
                        cache: false,
                        contentType: false,
                        processData: false,
                        xhr: function () {
                            var myXhr = $.ajaxSettings.xhr();
                            if (myXhr.upload) {
                                myXhr.upload.addEventListener('progress', function (e) {
                                    if (e.lengthComputable && uploadProgress) {
                                        uploadProgress.setMaximum(e.total);
                                        uploadProgress.setValue(e.loaded);
                                        if (uploadProgress.isSuccess()) {
                                            for (var i in self.onUpload) {
                                                self.onUpload[i].call(this, self);
                                            }
                                            getStatus();
                                        }
                                    }
                                }, false);
                            }
                            return myXhr;
                        },
                        beforeSend: function () {
                            uploadProgress = pipas.progress.show(self.progressContainerId);
                            uploadProgress.setLabel(pipas.upload.text.upload);
                        },
                        success: function () {
                            if (uploadProgress)uploadProgress.close();
                        },
                        error: function (jqXHR, status, error) {
                            pipas.message.showError("Failed to upload files");
                            if (uploadProgress)uploadProgress.close();
                        }
                    });
                }
                else console.log("No file selected");
            };
            this.element = $(elementSelector);
            if (this.element.length > 1)throw new Error("Passed selector is not unique. Found " + this.element.length + " similar elements.")
            this.element.off('change', onChange).on('change', onChange);
            /** @type {string} url for obtaining processing status */
            this.processingStatusUrl = null;
            var modalId = this.element.closest(".modal").attr("id");
            /** @type {string} Identifier for progress target (as body element or id selector without grille) */
            this.progressContainerId = modalId ? modalId + " .modal-dialog" : "body";
        }
    }
})(jQuery, pipas);