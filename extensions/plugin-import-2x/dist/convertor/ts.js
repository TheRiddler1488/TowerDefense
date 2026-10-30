"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSImporter = void 0;
const base_1 = require("../common/base");
const utlis_1 = require("../common/utlis");
const parseCode_1 = require("../common/parseCode");
class TSImporter extends base_1.ImporterBase {
    constructor() {
        super(...arguments);
        this.type = 'script';
    }
    import(main) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._3dMeta.ver = '4.0.21';
                this._3dMeta.importer = 'typescript';
                let name = this.pathInfo.name;
                
                name = utlis_1.scriptName.getValidClassName(name);
                let code = this.readFileSync();
                if (code) {
                    let needParse = false;
                    let commentCode = '';
                    code.trim().split('\n').forEach((line) => {
                        commentCode += '
                        if (line.includes('export default class ') ||
                            line.includes('export class ') ||
                            line.includes('@ccclass')) {
                            needParse = true;
                        }
                    });
                    if (needParse) {
                        const data = yield (0, parseCode_1.parseTSCode)(name, this.sourceFsPath);
                        this._2dTo3dSource = data.content;
                        this._2dTo3dSource += `\n`;
                        this._2dTo3dSource += commentCode;
                    }
                    else {
                        this._2dTo3dSource = code;
                    }
                    utlis_1.scriptList.set(name, this.destFsPath);
                }
                return true;
            }
            catch (e) {
                console.error(e + ',\n this file path: ' + this.sourceFsPath);
                return false;
            }
        });
    }
}
exports.TSImporter = TSImporter;
