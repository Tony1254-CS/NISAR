const { compileFromFile } = require('json-schema-to-typescript')
const fs = require('fs')

const schemaPath = '../schemas/all.json'
const outPath = 'src/data/types.ts'

async function generate() {
    if (!fs.existsSync('src/data')) {
        fs.mkdirSync('src/data', { recursive: true })
    }
    
    // Compile the single combined schema
    const ts = await compileFromFile(schemaPath, { bannerComment: '' })
    fs.writeFileSync(outPath, ts)
    console.log('Types generated at', outPath)
}

generate().catch(console.error)
