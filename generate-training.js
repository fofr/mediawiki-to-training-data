import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'
import { ChatGPTAPI } from 'chatgpt'
dotenv.config()

const outputDir = 'pages'
const trainingDir = 'training_data'
const concurrentRequests = 10

const getSystemMessage = (questionCount) => {
  return `
Act as a javascript API, you only return JSON. Output will be parsed as JSONL, non-JSONL output will be ignored.

You will be given a text block. Based on that text you must craft ${questionCount} questions and answers.
Return those in the JSON format. You do not need to access any external content.

In the text block, the first line is the title of the content. Incorporate the title into your question.

Return your JSON using JSONL in the format:
{ "prompt": [the first question], "completion": [the answer] }
{ "prompt": [the second question], "completion": [the answer] }
{ "prompt": [the third question], "completion": [the answer] }
...`
}

const isValidJSONL = (jsonl) => {
  const lines = jsonl.split('\n')
  return lines.every((line) => {
    try {
      if (line.trim() === '') return true
      const obj = JSON.parse(line)

      if (typeof obj.prompt !== 'string') {
        if (Array.isArray(obj.prompt)) {
          obj.prompt = obj.prompt.join(' ')
        } else {
          return false
        }
      }

      if (typeof obj.completion !== 'string') {
        if (Array.isArray(obj.completion)) {
          obj.completion = obj.completion.join(' ')
        } else {
          return false
        }
      }

      return true
    } catch (e) {
      return false
    }
  })
}

const parseJSONL = (jsonl) => {
  const lines = jsonl.split('\n')
  return lines
    .filter(line => line.trim() !== '')
    .map(line => JSON.stringify(JSON.parse(line)))
    .join('\n')
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('Please set the OPENAI_API_KEY environment variable')
    process.exit(1)
  }

  const files = fs.readdirSync(outputDir)
  const fileChunks = []

  for (let i = 0; i < files.length; i += concurrentRequests) {
    fileChunks.push(files.slice(i, i + concurrentRequests))
  }

  for (const chunk of fileChunks) {
    const chunkPromises = chunk.map(async (file) => {
      const trainingPath = path.join(trainingDir, path.basename(file, '.txt') + '.jsonl')
      if (fs.existsSync(trainingPath)) {
        console.log(`Skipping ${file} as a .jsonl file already exists`)
        return
      }

      console.log(`Processing ${file}`)
      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8')
      const questionCount = content.length > 5000 ? 10 : Math.ceil(content.length / 500)

      console.log(content.length, questionCount)
      const chatAgent = new ChatGPTAPI({
        apiKey,
        systemMessage: getSystemMessage(questionCount)
      })

      try {
        const res = await chatAgent.sendMessage(content)

        if (isValidJSONL(res.text)) {
          const parsedContent = parseJSONL(res.text)
          fs.writeFileSync(trainingPath, parsedContent)
          console.log(`Wrote parsed JSONL to ${trainingPath}`)
        } else {
          console.error(`Invalid JSONL in:\n\n${res.text}`)
        }
      } catch (err) {
        console.error(`An error occurred while processing ${file}:`, err)
      }
    })

    await Promise.all(chunkPromises)
  }
}

main().catch((err) => {
  console.error('An error occurred:', err)
  process.exit(1)
})
