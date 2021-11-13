import { argv } from 'process'
import sharp from 'sharp'
import { readdir, unlink } from 'fs/promises'
import { sep, extname } from 'path'

const convertAndSave = async (path, name) => {
    const image = sharp(path + name)

    const { width } = await image.metadata()
    return image
        .resize({ width: Math.floor(width / 1.75) })
        .jpeg({
            mozjpeg: true,
            quality: 92,
        })
        .toFile(`${path}r_${name}`)
}

const isImage = name => {
    let ext = extname(name)
    if (!ext) {
        return false
    }
    ext = ext.toLowerCase()
    return ext === '.jpeg' || ext === '.jpg'
}

const handleAllRecursive = async (path) => {
    const files = (await readdir(path, { withFileTypes: true }))
        .map(file => ({
            isDirectory: file.isDirectory(),
            isImage: file.isFile() && isImage(file.name),
            name: file.name,
            path,
        }))

    return Promise.all(files.map(async ({ path, name, isImage, isDirectory }) => {
        const fullPath = path + name
        if (isImage) {
            await convertAndSave(path, name)
            await unlink(path + name)
        } else if (isDirectory) {
            handleAllRecursive(fullPath + sep)
        }
    }))
}

const targetDir = argv[2]

if (targetDir && targetDir.endsWith(sep)) {
    handleAllRecursive(targetDir)
} else {
    console.error('wrong targetDir passed:', targetDir)
}
