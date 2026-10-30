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
Object.defineProperty(exports, '__esModule', { value: true });
exports.ImporterBase = void 0;
// @ts-ignore
const node_uuid_1 = require('node-uuid');
const utlis_1 = require('./utlis');
const path_1 = require('path');
// @ts-ignore
const fs_extra_1 = require('fs-extra');
const utlis_2 = require('./utlis');
const diff_1 = require('./diff');
const convertor_1 = require('../convertor');
class ImporterBase {
    constructor() {
        this.type = '';

        this.destFsPath = '';
        this.destMetaFsPath = '';

        this.sourceFsPath = '';
        this.pathInfo = null;
        this._2dMeta = null;
        this._3dMeta = null;

        this._2dTo3dSource = null;
    }

    checkUuid(meta) {
        return __awaiter(this, void 0, void 0, function* () {
            const assetFsPath = yield Editor.Message.request(
                'asset-db',
                'query-path',
                meta.uuid
            );
            if (assetFsPath && assetFsPath !== this.destFsPath) {
                const newUuid = (0, node_uuid_1.v4)();
                (0, utlis_2.saveUuid)(meta.uuid, newUuid);
                return newUuid;
            }

            if (meta.type === 'sprite' && meta.subMetas) {
                for (const key in meta.subMetas) {
                    const subMeta = meta.subMetas[key];
                    (0, utlis_2.saveUuid)(subMeta.uuid, subMeta.rawTextureUuid);
                }
            }
            return meta.uuid;
        });
    }
    get3DUuid() {
        try {
            const meta = (0, fs_extra_1.readJSONSync)(this.destMetaFsPath);
            return meta.uuid;
        } catch (e) {
            return (0, node_uuid_1.v4)();
        }
    }
    reset() {
        this.destFsPath = '';
        this.sourceFsPath = '';
        this.pathInfo = null;
        this._2dMeta = null;
        this._3dMeta = null;
        this._2dTo3dSource = null;
    }
    static getPathInfo(projectRoot, sourceFsPath) {
        let relativePath = (0, path_1.relative)(projectRoot, sourceFsPath);
        if (!relativePath.startsWith('assets')) {
            relativePath = (0, path_1.join)('assets', relativePath);
        }
        let to = (0, path_1.join)(Editor.Project.path, relativePath);

        if (to.endsWith('.fire')) {
            to = to.replace(/.fire+$/g, '.scene');
        } else if (to.endsWith('.js')) {
            const meta = (0, fs_extra_1.readJSONSync)(sourceFsPath + '.meta');
            if (!meta.isPlugin) {
                to = to.replace(/.js+$/g, '.ts');
            }
        }
        return {
            to: to,
            toMeta: to + '.meta',
            from: sourceFsPath,
            fromMeta: sourceFsPath + '.meta',
            pathInfo: (0, path_1.parse)(sourceFsPath)
        };
    }
    static isNew(projectRoot, sourceFsPath) {
        try {
            if (sourceFsPath.endsWith('assets')) {
                return false;
            }
            const info = ImporterBase.getPathInfo(projectRoot, sourceFsPath);
            if (
                (0, fs_extra_1.existsSync)(info.to) &&
                (0, fs_extra_1.existsSync)(info.toMeta)
            ) {
                const _3DMeta = (0, fs_extra_1.readJSONSync)(info.toMeta);
                if (_3DMeta.importer === 'directory') {
                    return false;
                }
                const _2DMeta = (0, fs_extra_1.readJSONSync)(info.fromMeta);
                return _2DMeta.uuid !== _3DMeta.uuid;
            }
            return true;
        } catch (e) {
            return true;
        }
    }

    beforeImport(projectRoot, sourceFsPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.reset();

            this.sourceFsPath = sourceFsPath;
            const info = ImporterBase.getPathInfo(projectRoot, sourceFsPath);
            this.destFsPath = info.to;
            this.destMetaFsPath = info.toMeta;
            this.pathInfo = info.pathInfo;

            this._2dMeta = this.read2dMeta(sourceFsPath);

            const newUuid = this._2dMeta
                ? yield this.checkUuid(this._2dMeta)
                : this.get3DUuid();
            this._3dMeta = this.createNewMeta(newUuid);
            this._3dMeta.uuid = newUuid;
            this._2dMeta &&
                utlis_2.importProjectAssets.set(this._2dMeta.uuid, {
                    type: (0, path_1.extname)(sourceFsPath),
                    basePath: sourceFsPath,
                    outPath: this.destMetaFsPath,
                    outUuid: this._2dMeta.uuid,
                    meta: this._2dMeta
                });
            return true;
        });
    }
    needImport() {
        let doImport = true;
        if (
            (0, fs_extra_1.existsSync)(this.destFsPath) &&
            (0, fs_extra_1.existsSync)(this.destMetaFsPath)
        ) {
            const meta = (0, fs_extra_1.readJSONSync)(this.destMetaFsPath);
            doImport = this._3dMeta.uuid !== meta.uuid;
        }
        if (doImport) {
        }
        return doImport;
    }

    import(main) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }

    afterImport() {
        return __awaiter(this, void 0, void 0, function* () {
            this.copySync(this.sourceFsPath);
            if (this._2dTo3dSource) {
                try {
                    if (
                        this.destFsPath.endsWith('.ts') ||
                        this.destFsPath.endsWith('.js') ||
                        this.destFsPath.endsWith('.plist') ||
                        this.destFsPath.endsWith('.effect')
                    ) {
                        (0, fs_extra_1.writeFileSync)(
                            this.destFsPath,
                            this._2dTo3dSource,
                            { encoding: 'utf8' }
                        );
                    } else {
                        (0, fs_extra_1.writeJSONSync)(
                            this.destFsPath,
                            this._2dTo3dSource,
                            { spaces: 2 }
                        );
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            this.saveMeta();
        });
    }

    createNewMeta(uuid) {
        return {
            uuid: uuid || '',
            imported: false,
            importer: '*',
            files: [],
            subMetas: {},
            userData: {},
            ver: '0.0.1'
        };
    }

    read2dMeta(sourceFsPath) {
        try {
            if (!sourceFsPath.endsWith('.meta')) {
                sourceFsPath += '.meta';
            }
            if (!(0, fs_extra_1.existsSync)(sourceFsPath)) {
                return null;
            }
            return (0, fs_extra_1.readJSONSync)(sourceFsPath);
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    copySync(from, to) {
        try {
            if (!(0, fs_extra_1.existsSync)(from)) {
                return 0;
            }
            if (to) {
                (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(to));
                (0, fs_extra_1.copyFileSync)(from, to);
            } else {
                (0, fs_extra_1.ensureDirSync)(
                    (0, path_1.dirname)(this.destFsPath)
                );
                (0, fs_extra_1.copyFileSync)(from, this.destFsPath);
            }
        } catch (e) {
            console.error(e);
        }
    }

    saveMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.destMetaFsPath.endsWith('.meta')) {
                this.destMetaFsPath += '.meta';
            }
            try {
                (0, fs_extra_1.writeJSONSync)(
                    this.destMetaFsPath,
                    this._3dMeta,
                    { spaces: 2 }
                );
            } catch (e) {
                console.error(e);
            }
        });
    }

    writeFileSync(to, data) {
        try {
            (0, fs_extra_1.writeFileSync)(to, data, { encoding: 'utf8' });
        } catch (e) {
            console.error(e);
        }
    }

    readJSONSync(sourceFsPath) {
        try {
            return (0, fs_extra_1.readJSONSync)(
                sourceFsPath || this.sourceFsPath
            );
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    readFileSync(sourceFsPath) {
        try {
            return (0, fs_extra_1.readFileSync)(
                sourceFsPath || this.sourceFsPath,
                'utf8'
            );
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    migratePlatformSettings(platformSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, utlis_2.migratePlatformSettings)(platformSettings);
        });
    }
    static getUuid(uuid, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (diff_1.UUID_2D_TO_3D.has(uuid)) {
                return diff_1.UUID_2D_TO_3D.get(uuid);
            }
            if (diff_1.UUID_UI_2D_TO_3D.has(uuid)) {
                return diff_1.UUID_UI_2D_TO_3D.get(uuid);
            }
            if (diff_1.UUID_SKIP_EFFECT.has(uuid)) {
                console.warn(
                    Editor.I18n.t('plugin-import-2x.effect_warn_tips', {
                        name: diff_1.UUID_SKIP_EFFECT.get(uuid)
                    })
                );
            }
            uuid = yield ImporterBase.ensureDefaultAssets2DFor3D(uuid);
            uuid = (0, utlis_2.getNewUuid)(uuid);
            if (type && !uuid.includes('@')) {
                const id = `@${ImporterBase.getNameByID(type)}`;
                if (!uuid.endsWith(id)) {
                    uuid += id;
                }
            }
            return uuid;
        });
    }
    static getNewUuid(uuid) {
        return (0, utlis_2.getNewUuid)(uuid);
    }

    static getNameByID(name) {
        return (0, utlis_1.nameToId)(name);
    }

    static getDefaultAssets2D(uuid) {
        return (0, utlis_2.getDefaultAssets2D)(uuid);
    }

    static ensureDefaultAssets2DFor3D(uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const subAssets = utlis_2.importSubAssets.get(uuid);
            if (subAssets) {
                uuid = subAssets.baseUuid;
            } else {
                const projectAssets = utlis_2.importProjectAssets.get(uuid);
                if (projectAssets) {
                    uuid = projectAssets.outUuid;
                }
            }
            const info = (0, utlis_2.getDefaultAssets2D)(uuid);
            if (info && info.path) {
                if (diff_1.UUID_UI_2D_TO_3D.has(info.baseUuid)) {
                    return diff_1.UUID_UI_2D_TO_3D.get(info.baseUuid);
                }
                if (diff_1.UUID_2D_TO_3D.has(info.baseUuid)) {
                    return diff_1.UUID_2D_TO_3D.get(info.baseUuid);
                }
                const defaultAssetsRootPath = (0, path_1.join)(
                    __dirname,
                    '../../static'
                );
                let relativePath = (0, path_1.relative)(
                    defaultAssetsRootPath,
                    info.path
                );
                if (!relativePath.startsWith('assets')) {
                    relativePath = (0, path_1.join)('assets', relativePath);
                }
                const destFsPath = (0, path_1.join)(
                    Editor.Project.path,
                    relativePath
                );
                try {
                    if (!(0, fs_extra_1.existsSync)(destFsPath)) {
                        if (
                            destFsPath.endsWith('.mtl') ||
                            destFsPath.endsWith('.effect')
                        ) {
                            yield (0, utlis_2.import2DChunks)(false);
                        }
                        const converter = (0, convertor_1.getConverter)(
                            (0, path_1.extname)(info.path)
                        );
                        if (converter) {
                            yield converter.beforeImport(
                                defaultAssetsRootPath,
                                info.path
                            );
                            const isDone = yield converter.import();
                            if (isDone) {
                                yield converter.afterImport();
                            }
                        }
                        const readmePath = (0, path_1.join)(
                            Editor.Project.path,
                            'asset',
                            'migrate-resources',
                            'README.md'
                        );
                        if (!(0, fs_extra_1.existsSync)(readmePath)) {
                            (0, fs_extra_1.ensureDirSync)(
                                (0, path_1.dirname)(readmePath)
                            );
                            (0, fs_extra_1.writeFileSync)(
                                readmePath,
                                (0, fs_extra_1.readFileSync)(
                                    (0, path_1.join)(
                                        defaultAssetsRootPath,
                                        'migrate-resources',
                                        'README.md'
                                    ),
                                    { encoding: 'utf8' }
                                )
                            );
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
                if (subAssets) {
                    return subAssets.uuid;
                }
                return info.baseUuid;
            }
            if (subAssets) {
                return subAssets.uuid;
            }
            return uuid;
        });
    }

    queryCCClass(engine, message) {
        return __awaiter(this, void 0, void 0, function* () {
            engine.contentWindow.postMessage(message, '*');
            return new Promise((resolve, reject) => {
                function onMessageCb(event) {
                    window.removeEventListener('message', onMessageCb, false);
                    resolve(event.data);
                }
                window.addEventListener('message', onMessageCb, false);
            });
        });
    }
    replaceScript(name) {
        try {
            const defaultAssetsRootPath = (0, path_1.join)(
                __dirname,
                '../../static/migrate-resources/default-assets-2d/scripts'
            );
            const fromFsPath = (0, path_1.join)(defaultAssetsRootPath, name);
            const destFsPath = (0, path_1.join)(
                Editor.Project.path,
                'assets',
                'default-assets-2d',
                'scripts',
                name
            );
            if (!(0, fs_extra_1.existsSync)(destFsPath)) {
                (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(destFsPath));
                (0, fs_extra_1.copyFileSync)(fromFsPath, destFsPath);
            }
            const fromMetaPath = fromFsPath + '.meta';
            const destMetaFsPath = destFsPath + '.meta';
            if (!(0, fs_extra_1.existsSync)(destMetaFsPath)) {
                (0, fs_extra_1.ensureDirSync)(
                    (0, path_1.dirname)(destMetaFsPath)
                );
                (0, fs_extra_1.copyFileSync)(fromMetaPath, destMetaFsPath);
            }
            const meta = (0, fs_extra_1.readJSONSync)(fromMetaPath);
            // @ts-ignore
            const EditorExtends = require('@base/electron-module').require(
                'EditorExtends'
            );
            const UuidUtils = EditorExtends.UuidUtils;
            return UuidUtils.compressUuid(meta.uuid, false);
        } catch (e) {
            console.error(e);
            return '';
        }
    }

    ensureDefaultSprite2DFor3D(json3D) {
        for (const key in json3D) {
            const item = json3D[key];
            if (item.__type__ === 'cc.StudioComponent') {
                item.__type__ = this.replaceScript('studio-component.ts');
            } else if (item.__type__ === 'cc.StudioWidget') {
                item.__type__ = this.replaceScript('studio-widget.ts');
            }
        }
        return json3D;
    }
}
exports.ImporterBase = ImporterBase;
