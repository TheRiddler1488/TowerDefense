'use strict';

declare const Editor: any;

exports.methods = {
    async importCreatorProject() {
        const result = await Editor.Dialog.select({
            title: Editor.I18n.t('plugin-import-2x.select_dialog.title'),
            path:
                (await Editor.Profile.getConfig(
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
    }
};

exports.load = function () {};

exports.unload = function () {};
