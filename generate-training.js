import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'
import { ChatGPTAPI } from 'chatgpt'
dotenv.config()

const outputDir = 'pages'
const trainingDir = 'training_data'
const concurrentRequests = 2

const getSystemMessage = () => {
  return `
You only return content in the defined structure.

You will be given a description of what happens in an episode of Star Trek.
You need to write a synopsis of this episode in a “Choose your own adventure” style.
While you give choices that you could take, you do not follow those choices.
You take a single path through the episode.

If you chose startingChoice1, you do not give details about startingChoice2 and vice versa.
If you chose optA, you do not give details about optB and vice versa.
It's ok to ignore the parts of the episode that do not relate to your chosen story path.

Use a second person perspective. Always use 'You', not 'I'.

You must use the following structure, this is so responses can be correctly coded.

\`\`\`
<flavor>[the type of series, for example TNG, DS9, VOY, ENT, TOS, TAS, DIS]</flavor>
<start>
<startingChoice1> You are ... [give episode context] </startingChoice1>
<startingChoice2> You are ... [give episode context] </startingChoice2>
</start>

<scene1>
<context> [context from startionChoice] </context>
<desc> [engaging and interesting description of what happens next and the choice that needs to be made] </desc>
<optA> [first option] </optA>
<optB> [second option] </optB>
</scene1>

<scene2>
<context> [context from startionChoice and scene1 choice] </context>
...
</scene2>

<scene3>
<context> [context from startionChoice, scene1 choice and scene2 choice] </context>
...
</scene3>

...

<ending> [what happened at the end as a result of your choices] </ending>
\`\`\`

Here is an example:

\`\`\`
<flavor> TNG </flavor>
<start>
<startingChoice1> You are the captain of the USS Enterprise. You are on a diplomatic mission across the alpha quadrant.</startingChoice1>
<startingChoice2> You are the chief engineer of the USS Enterprise. You are on duty in engineering when a ship alert sounds.</startingChoice2>
</start>

<scene1>
<context> You have chosen to be the captain of the USS Enterprise. You are on a diplomatic mission across the alpha quadrant.</context>
<desc> As you sit in the captain's chair, your first officer informs you of a distress signal coming from a nearby planet. You must decide whether to investigate or continue your current mission. </desc>
<optA> Investigate the distress signal. </optA>
<optB> Continue the current mission. </optB>
</scene1>

<scene2>
<context> You have chosen to be the captain of the USS Enterprise. You are on a diplomatic mission across the alpha quadrant. You chose to investigate the distress signal. </context>
<desc> Upon arriving at the planet, you discover a damaged alien vessel. The aliens ask for your help in repairing their ship. You must decide whether to offer assistance or to leave them to their fate. </desc>
<optA> Offer assistance in repairing their ship. </optA>
<optB> Leave the aliens to their fate. </optB>
</scene2>

<scene3>
<context> You have chosen to be the captain of the USS Enterprise. You are on a diplomatic mission across the alpha quadrant. You chose to investigate the distress signal. You chose to offer assistance in repairing the ship. </context>
...
</scene3>

...

<ending> Helping the aliens repair their ship earns you their gratitude and an alliance. Your reputation as a compassionate and wise captain grows. </ending>
\`\`\`

Give exactly:

- 1 start tag with 2 interesting and compelling choices
- 6 sequential scene tags, <scene1> through <scene6> with 2 options each
- scene1 must have a context that includes your choice from start
- scene2 must have a context that includes your choice from start, scene1
- scene3 must have a context that includes your choice from start, scene1 and scene2
- scene4 must have a context that includes your choice from start, scene1, scene2 and scene3
- scene5 must have a context that includes your choice from start, scene1, scene2, scene3 and scene4
- scene6 must have a context that includes your choice from start, scene1, scene2, scene3, scene4 and scene5
- 1 ending tag including the result of your choices

ONLY FOLLOW ONE PATH THROUGH THE STORY.
Ignore the choices that were not taken.
Ignore parts of the episode synopsis that are not relevant to your chosen path.
You take a single path through the episode.
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
      const trainingPath = path.join(trainingDir, path.basename(file, '.txt') + '.md')
      if (fs.existsSync(trainingPath)) {
        console.log(`Skipping ${file} as a .jsonl file already exists`)
        return
      }

      console.log(`Processing ${file}`)
      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8')
      console.log(content.length)
      const chatAgent = new ChatGPTAPI({
        apiKey,
        completionParams: {
          model: 'gpt-4'
        },
        systemMessage: getSystemMessage(questionCount)
      })

      try {
        const res = await chatAgent.sendMessage(content)
        fs.writeFileSync(trainingPath, res.text)
        console.log(`Wrote content to ${trainingPath}`)
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
