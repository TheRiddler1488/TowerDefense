'use strict';

import { init2DChunks } from '../common/utlis';
import { initDiff } from '../common/diff';
import { ImageImporter } from './image';
import { BitmapImporter } from './fnt';
import { TextImporter } from './text';
import { AudioImporter } from './audio';
import { PlistImporter } from './plist';
import { JSONImporter } from './json';
import { TmxImporter } from './tmx';
import { MaterialImporter } from './mtl';
import { FbxImporter } from './fbx';
import { TTFFontImporter } from './ttf';
import { AutoAtlasImporter } from './pac';
import { AnimImporter } from './anim';
import { FireImporter } from './fire';
import { PrefabImporter } from './prefab';
import { JSImporter } from './js';
import { TSImporter } from './ts';
import { TsxImporter } from './tsx';
import { BinImporter } from './bin';
import { DbbinImporter } from './dbbin';
import { EffectImporter } from './effect';
import { GltfImporter } from './gltf';
import { LabelAtlasImporter } from './label-atlas';
import { AtlasImporter } from './atlas';
import { SacImporter } from './sac';
import { PhysicsMaterialImporter } from './pmtl';
import { SkelImporter } from './skel';
import { SkeletonImporter } from './skeleton';
import { VideoImporter } from './video';
import { ImporterBase } from '../common/base';
import { extname } from 'path';

const keys: string[] = [];
export const converterMap: Map<string, ImporterBase> = new Map<
    string,
    ImporterBase
>();

function register(Importer: any, extnames: string[]) {
    extnames.forEach((extname) => {
        if (!keys.includes(extname)) {
            keys.push(extname);
        }
        converterMap.set(extname, new Importer());
    });
}

function initConvert() {
    keys.length = 0;
    converterMap.clear();
}

export function bubbleSort(tree: any) {
    let i, j, stop;
    const len = tree.length;
    for (i = 0; i < len; i++) {
        for (j = 0, stop = len - i; j < stop - 1; j++) {
            const a = tree[j],
                b = tree[j + 1];
            const aIndex = keys.indexOf(extname(a.detail.value));
            const bIndex = keys.indexOf(extname(b.detail.value));
            if (aIndex > bIndex) {
                const temp = tree[j];
                tree[j] = tree[j + 1];
                tree[j + 1] = temp;
            }
        }
    }
    return tree;
}

export function getConverter(exatname: string) {
    return converterMap.get(exatname);
}

export function registerConverter() {
    initConvert();
    initDiff();
    init2DChunks();

    register(ImageImporter, ['.png', '.jpg', '.jpeg', '.webp']);
    register(TextImporter, [
        '.pem',
        '.txt',
        '.html',
        '.htm',
        '.xml',
        '.css',
        '.less',
        '.scss',
        '.styl',
        '.stylus',
        '.yaml',
        '.ini',
        '.csv',
        '.proto',
        '.md',
        '.markdown'
    ]);
    register(AudioImporter, ['.mp3', '.wav', '.ogg', '.aac', '.pcm', '.m4a']);
    register(VideoImporter, ['.mp4']);
    register(TTFFontImporter, ['.ttf']);
    register(BitmapImporter, ['.fnt']);
    register(BinImporter, ['.bin']);
    register(DbbinImporter, ['.dbbin']);
    register(SacImporter, ['.sac']);
    register(JSONImporter, ['.json']);
    register(AtlasImporter, ['.atlas']);
    register(PhysicsMaterialImporter, ['.pmtl']);
    register(GltfImporter, ['.gltf']);
    register(SkelImporter, ['.skel']);
    register(SkeletonImporter, ['.skeleton']);
    register(TsxImporter, ['.tsx']);
    register(TmxImporter, ['.tmx']);
    register(FbxImporter, ['.fbx', '.FBX']);
    register(PlistImporter, ['.plist']);
    register(AutoAtlasImporter, ['.pac']);
    register(LabelAtlasImporter, ['.labelatlas']);
    register(EffectImporter, ['.effect']);
    register(MaterialImporter, ['.mtl']);
    register(AnimImporter, ['.anim']);
    register(PrefabImporter, ['.prefab']);
    register(FireImporter, ['.fire']);

    register(JSImporter, ['.js']);
    register(TSImporter, ['.ts']);
}
