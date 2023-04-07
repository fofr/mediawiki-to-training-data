import fs from 'fs/promises'
import path from 'path'

const trainingDir = 'training'
const combinedFileName = 'combined.jsonl'

async function main() {
  try {
    // Read all files in the training directory
    const files = await fs.readdir(trainingDir)

    // Filter the .jsonl files
    const jsonlFiles = files.filter(file => file.endsWith('.jsonl'))

    // Initialize an empty array to store the content of each .jsonl file
    const jsonlContents = []

    // Iterate through each .jsonl file
    for (const jsonlFile of jsonlFiles) {
      // Read the content of the .jsonl file
      const content = await fs.readFile(path.join(trainingDir, jsonlFile), 'utf-8')

      // Add the content to the array
      jsonlContents.push(content)
    }

    // Combine all contents into a single string with newline separation
    const combinedContent = jsonlContents.join('\n')

    // Write the combined content to the output file
    await fs.writeFile(path.join(trainingDir, combinedFileName), combinedContent)

    console.log(`Combined .jsonl files into ${combinedFileName}`)
  } catch (err) {
    console.error('An error occurred:', err)
  }
}

main()
