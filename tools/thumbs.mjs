// Gera miniaturas de 600px para a galeria (galeria/600/) e o ícone do logo
// usado no cabeçalho (logo/logo-mark.webp). Rode depois de `npm run webp`.
//   npm run thumbs
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'galeria';
const OUT = path.join(SRC, '600');
await mkdir(OUT, { recursive: true });

for (const file of (await readdir(SRC)).filter(f => f.endsWith('.webp'))) {
    await sharp(path.join(SRC, file))
        .resize({ width: 600, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(path.join(OUT, file));
    console.log('thumb', file);
}

await sharp('logo/logo-3d.webp')
    .resize(128, 128)
    .webp({ quality: 85 })
    .toFile('logo/logo-mark.webp');
console.log('logo-mark ok');

// mascote da hero também em 800px (celular de tela densa)
await mkdir(path.join(SRC, '800'), { recursive: true });
await sharp(path.join(SRC, 'mascote-alien-dragao.webp'))
    .resize({ width: 800 })
    .webp({ quality: 80 })
    .toFile(path.join(SRC, '800', 'mascote-alien-dragao.webp'));
console.log('mascote 800 ok');
