import fs from 'fs-extra'
import xml2js from 'xml2js'
const parser = new xml2js.Parser()
const args = process.argv.slice(2)

if (args.length < 1) {
  console.error('Usage: node splitXML.js <input-file>')
  process.exit(1)
}

const inputFile = args[0]
const outputFolder = 'output'
const excludedPrefixes = [
  'User:',
  'User talk:',
  'User blog:',
  'User blog comment:',
  'MediaWiki:',
  'File:',
  'Talk:',
  'Forum:'
]

const filterPages = (page) => {
  return (
    !excludedPrefixes.some(prefix => page.title[0].startsWith(prefix)) &&
    !page.hasOwnProperty('redirect')
  )
}

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

    const pages = result.mediawiki.page.filter(filterPages)

    fs.ensureDir(outputFolder)
      .then(() => {
        pages.forEach(page => {
          const title = page.title[0].replace(/\//g, '-')
          const timestamp = page.revision[0].timestamp[0].split('T')[0]
          const filename = `${title}_${timestamp}`.replace(/[^\w\/]|_/g, '-').toLowerCase()
          const outputFile = `${outputFolder}/${filename}.json`

          fs.writeJson(outputFile, page, { spaces: 2 })
            .then(() => console.log(`Created: ${outputFile}`))
            .catch(err => console.error(`Error writing JSON file: ${err}`))
        })
      })
      .catch(err => console.error(`Error creating output folder: ${err}`))
  })
})