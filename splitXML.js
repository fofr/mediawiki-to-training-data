import fs from 'fs-extra'
import xml2js from 'xml2js'
const parser = new xml2js.Parser()
const args = process.argv.slice(2)

if (args.length < 1) {
  console.error('Usage: node splitXML.js <input-file>')
  process.exit(1)
}

const inputFile = args[0]
const outputFolder = 'pages'
const excludedPrefixes = [
  'User:',
  'User talk:',
  'User blog:',
  'User blog comment:',
  'MediaWiki:',
  'File:',
  'File talk:',
  'Talk:',
  'Template:',
  'Template talk:',
  'Forum:',
  'Forum talk:',
  'Board:',
  'Category:',
  'Category talk:',
  'Module:',
  'Thread:',

  // Wiki specific
  'Memory Alpha:'
]

const excludedTitles = [
  'Wiki:',
  'Wiki talk:'
]

const filterPages = (page) => {
  return (
    !excludedPrefixes.some(prefix => page.title[0].startsWith(prefix)) &&
    !excludedTitles.some(title => page.title[0].includes(title)) &&
    !page.hasOwnProperty('redirect')
  )
}

const excludeLinesWithoutContent = (text) => {
  const startsWith = [
    '[[en:',
    '[[da:',
    '[[de:',
    '[[fr:',
    '[[fi:',
    '[[es:',
    '[[it:',
    '[[no:',
    '[[nl:',
    '[[pl:',
    '[[pt:',
    '[[pt-br:',
    '[[ru:',
    '[[sv:',
    '[[zh:',
    '[[bg:',
    '[[cs:',
    '[[ja:',
    '[[Category:',
    '[[File:',
    '*{{startrek.com',
    '*{{Wikipedia}}',
    '*{{mbeta}}',
    ';{{visible'
  ]

  const lines = text.split('\n')
  const filteredLines = lines.filter(line => {
    const lineWithoutSpaces = line.replace(/\s/g, '')
    return !startsWith.some(prefix => lineWithoutSpaces.startsWith(prefix))
  })
  return filteredLines.join('\n')
}

function breakTextIntoChunks (text, maxChunkSize = 10000) {
  const lines = text.split('\n')
  const chunks = []
  let chunk = ''
  let chunkSize = 0

  for (const line of lines) {
    const lineSize = line.length + 1 // Adding 1 for the newline character
    if (chunkSize + lineSize <= maxChunkSize) {
      chunk += line + '\n'
      chunkSize += lineSize
    } else {
      chunks.push(chunk)
      chunk = line + '\n'
      chunkSize = lineSize
    }
  }

  if (chunk) {
    chunks.push(chunk)
  }

  return chunks
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
          let text = page.revision[0].text[0]._
          text = excludeLinesWithoutContent(text.replace(/<[^>]*>/g, ''))
          const chunks = breakTextIntoChunks(text)

          for (const [index, chunk] of chunks.entries()) {
            const outputData = `
${title}

${chunk}`.trim()

            const outputFile = `${outputFolder}/${filename}_${index}.txt`
            fs.writeFile(outputFile, outputData)
              .then(() => console.log(`Created: ${outputFile}`))
          }
        })
      })
      .catch(err => console.error(`Error creating output folder: ${err}`))
  })
})
