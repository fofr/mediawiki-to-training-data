import fs from 'fs/promises'
import path from 'path'

const trainingDir = 'training_data'
const combinedFileName = process.argv[2]

// if the filename is not provided, exit the program
if (!combinedFileName) {
  console.error('Please provide a filename')
  process.exit(1)
}

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

      // Split the content into lines and filter the lines based on the conditions
      const filteredLines = content
        .split('\n')
        .filter(line => {
          const trimmedLine = line.trim();
          return (
            trimmedLine.length > 0 &&
            !trimmedLine.startsWith('[') &&
            !trimmedLine.endsWith(']') &&
            trimmedLine.includes('{"prompt":"') &&
            trimmedLine.includes(',"completion":"')
          );
        })

      // Join the filtered lines and add the content to the array
      jsonlContents.push(filteredLines.join('\n'))
    }

    // Combine all contents into a single string with newline separation
    const combinedContent = jsonlContents.join('\n')

    // Split the combined content into lines and filter out the empty lines
    const finalContent = combinedContent
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n')

    // Write the final content to the output file
    await fs.writeFile(combinedFileName, finalContent)

    console.log(`Combined .jsonl files into ${combinedFileName}`)
  } catch (err) {
    console.error('An error occurred:', err)
  }
}

main()
