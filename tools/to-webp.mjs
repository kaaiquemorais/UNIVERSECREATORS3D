/**
 * Converte todas as imagens do site (galeria/ e logo/) para WebP.
 *
 *   node tools/to-webp.mjs            → converte e mantém os originais
 *   node tools/to-webp.mjs --delete   → converte e apaga os originais
 *
 * Imagens muito grandes são reduzidas: nenhuma área do site exibe mais
 * que ~600px de largura, então MAX_WIDTH acima disso é desperdício de banda.
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['galeria', 'logo'];
const SOURCE_EXT = ['.png', '.jpg', '.jpeg'];
const MAX_WIDTH = 1400;
const QUALITY = 82;

const deleteOriginals = process.argv.includes('--delete');
const kb = bytes => `${Math.round(bytes / 1024)} KB`;

let totalBefore = 0;
let totalAfter = 0;

for (const dir of DIRS) {
    const abs = join(ROOT, dir);
    const files = (await readdir(abs)).filter(f => SOURCE_EXT.includes(extname(f).toLowerCase()));

    for (const file of files) {
        const src = join(abs, file);
        const dest = join(abs, `${basename(file, extname(file))}.webp`);

        const before = (await stat(src)).size;
        const image = sharp(src);
        const { width } = await image.metadata();

        await image
            .resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 6 })
            .toFile(dest);

        const after = (await stat(dest)).size;
        totalBefore += before;
        totalAfter += after;

        console.log(`${dir}/${file}  ${kb(before)} → ${kb(after)}  (-${Math.round((1 - after / before) * 100)}%)`);

        if (deleteOriginals) await unlink(src);
    }
}

console.log(`\nTotal: ${kb(totalBefore)} → ${kb(totalAfter)} (-${Math.round((1 - totalAfter / totalBefore) * 100)}%)`);
if (deleteOriginals) console.log('Originais apagados.');
