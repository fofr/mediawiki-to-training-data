import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'
import { ChatGPTAPI } from 'chatgpt'
dotenv.config()

const outputDir = 'pages'
const trainingDir = 'training_data'
const concurrentRequests = 2

const newEpisode = () => {
  return `
Here is an example:

\`\`\`
<universe> TNG </universe>

<start>
<decision0>
<options>
<option1> You are the captain of the USS Enterprise. You are on a diplomatic mission across the alpha quadrant.</option1>
<option2> You are the chief engineer of the USS Enterprise. You are on duty in engineering when a ship alert sounds.</option2>
</options>
<choice0> option1 <choice0>
</decision0>
</start>

<scene1>
<context> You have chosen to be the captain of the USS Enterprise. [episode context]</context>
<desc> As you sit in the captain's chair, your first officer informs you of a distress signal coming from a nearby planet. You must decide whether to investigate or continue your current mission. </desc>
<decision1>
<options>
<option1> Investigate the distress signal. </option1>
<option2> Continue the current mission. </option2>
</options>
<choice1> option1 </choice1>
</decision1>
</scene1>

<scene2>
<context> You have chosen to be the captain of the USS Enterprise. You are on a diplomatic mission across the alpha quadrant. You chose to investigate the distress signal. </context>
<desc> Upon arriving at the planet, you discover a damaged alien vessel. The aliens ask for your help in repairing their ship. You must decide whether to offer assistance or to leave them to their fate. </desc>
<decision2>
<options>
<option1> Leave the aliens to their fate. </option1>
<option2> Offer assistance in repairing their ship </option2>
</options>
<choice2> option2 </choice2>
</decision2>
</scene2>
\`\`\`

Give exactly:

- 1 start tag with 2 interesting and compelling choices
- 3 sequential scene tags, <scene1> through <scene3> with 2 options each (do not fork the story)
- scene1 must have a context that includes your choice from start
- scene2 must have a context that includes your choice from start, scene1

ONLY FOLLOW ONE PATH THROUGH THE STORY.
Ignore the choices that were not taken.`
}

const addToExistingEpisode = () => {
  return ''
}

const getSystemMessage = (existingEpisode) => {
  return `
You are a brilliant "choose your own adventure" Star Trek story simulator. This is how you work:

As input, you are given a Star Trek episode synopsis. Given this input, you must transform this synopsis into a complete "choose your own adventure" style story.

A choose your own adventure story is a story where the reader is asked to choose between two decisions at different points in the narrative. The reader's decisions control what happens later in the story.

As a choose your own adventure simulator, your job is to act as both the writer and the reader. That is, you must generate the narrative and decision options as well as generate the decisions that a hypothetical reader makes.

You must follow these instructions:

* Given a description of a Star Trek episode, write a choose your own adventure version of the episode.
* Always write the story from the 2nd person perspective. Use "you" and not "I".
* You must choose a single path through the story. Once a decision is made, it cannot be altered. For example, you cannot change characters in the middle of the story. You do not elaborate on other possible narrative paths.
* You must use the following structure, this is so responses can be correctly coded.

\`\`\`
<universe>[type of series: TNG, DS9, VOY, ENT, TOS, TAS, DIS]</universe>

<start>
<decisionStart>
<options>
<option1> You are [Character 1] [episode context] </option1>
<option2> You are [Character 2] [episode context] </option2>
</options>
<choiceStart> [one of the options] </choice>
</decisionStart>
</start>

<scene1>
<context>
[context from decision1]
</context>
<desc> [engaging and interesting description of what happens next and the decision that needs to be made] </desc>
<decision1>
<options>
<option1> [first option] </option1>
<option2> [second option] </option2>
</options>
<choice1> [one of the options] </choice1>
</decision1>
</scene1>

<scene2>
<context>
[context from start and scene 1]
</context>
...
</scene2>

<scene2>
<context>
[context from start and scene 1 and scene 2]
</context>
...
</scene2>
...
\`\`\`

${existingEpisode ? addToExistingEpisode() : newEpisode()}
`
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('Please set the OPENAI_API_KEY environment variable')
    process.exit(1)
  }

  // Make the training directory if it doesn't exist
  fs.mkdirSync(trainingDir, { recursive: true })

  const files = fs.readdirSync(outputDir)
  const fileChunks = []

  for (let i = 0; i < files.length; i += concurrentRequests) {
    fileChunks.push(files.slice(i, i + concurrentRequests))
  }

  for (const chunk of fileChunks) {
    const chunkPromises = chunk.map(async (file) => {
      let episodeCount = 0
      const trainingPath = path.join(trainingDir, path.basename(file, '.txt') + '_0.txt')
      if (fs.existsSync(trainingPath)) {
        console.log(`Skipping ${file} as a .jsonl file already exists`)
        return
      }

      console.log(`Processing ${file}`)

      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8')
      console.log(content.length)
      const existingEpisode = false
      const chatAgent = new ChatGPTAPI({
        apiKey,
        // completionParams: {
        //   model: 'gpt-4'
        // },
        systemMessage: getSystemMessage(existingEpisode)
      })

      try {
        const followUpMessage = 'Please continue the story based on the episode synopsis. Add 3 more scenes'
        let res = await chatAgent.sendMessage(content)
        writeResponse(res, file, episodeCount)

        episodeCount++
        let parentMessageId = res.id
        res = await chatAgent.sendMessage(followUpMessage, { parentMessageId })
        writeResponse(res, file, episodeCount)

        episodeCount++
        parentMessageId = res.id
        res = await chatAgent.sendMessage(`
${followUpMessage} and an ending in the format:
<ending> [what happened at the end as a result of your choices] </ending>

For example:
<ending> Helping the aliens repair their ship earns you their gratitude and an alliance. Your reputation as a compassionate and wise captain grows. </ending>
`, { parentMessageId })
        writeResponse(res, file, episodeCount)

      } catch (err) {
        console.error(`An error occurred while processing ${file}:`, err)
      }
    })

    await Promise.all(chunkPromises)
  }
}

const writeResponse = (res, episodeFile, episodeCount) => {
  const trainingPath = path.join(trainingDir, path.basename(episodeFile, '.txt') + `_${episodeCount}.txt`)
  fs.writeFileSync(trainingPath, res.text)
  console.log(`Wrote content to ${trainingPath}`)
}

main().catch((err) => {
  console.error('An error occurred:', err)
  process.exit(1)
})
