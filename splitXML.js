import fs from 'fs-extra'
import xml2js from 'xml2js'
const parser = new xml2js.Parser()
const args = process.argv.slice(2)

if (args.length < 1) {
  console.error('Usage: node splitXML.js <input-file> [items-per-file]')
  process.exit(1)
}

const inputFile = args[0]
const outputFolder = 'output'
const itemsPerFile = args.length > 1 ? parseInt(args[1]) : 100

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading XML file: ${err}`)
    return
  }

  parser.parseString(data, (err, result) => {
    if (err) {
      console.error(`Error parsing XML: ${err}`)
      return
    }

    const pages = result.mediawiki.page
    const totalPages = pages.length
    const totalFiles = Math.ceil(totalPages / itemsPerFile)

    fs.ensureDir(outputFolder)
      .then(() => {
        for (let i = 0; i < totalFiles; i++) {
          const start = i * itemsPerFile
          const end = Math.min(start + itemsPerFile, totalPages)
          const outputFile = `${outputFolder}/file-${i + 1}.json`

          const filePages = pages.slice(start, end)
          fs.writeJson(outputFile, filePages, { spaces: 2 })
            .then(() => console.log(`Created: ${outputFile}`))
            .catch(err => console.error(`Error writing JSON file: ${err}`))
        }
      })
      .catch(err => console.error(`Error creating output folder: ${err}`))
  })
})
