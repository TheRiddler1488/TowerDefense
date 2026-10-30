'use strict';
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next()
            );
        });
    };

exports.methods = {
    importCreatorProject() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield Editor.Dialog.select({
                title: Editor.I18n.t('plugin-import-2x.select_dialog.title'),
                path:
                    (yield Editor.Profile.getConfig(
                        'plugin-import-2x',
                        'import-path'
                    )) || Editor.Project.path,
                type: 'directory'
            });
            if (!result.filePaths || !result.filePaths[0]) {
                return;
            }
            Editor.Profile.setConfig(
                'plugin-import-2x',
                'import-path',
                result.filePaths[0]
            );
            Editor.Panel.open('plugin-import-2x.creator');
        });
    }
};

exports.load = function () {};

exports.unload = function () {};
