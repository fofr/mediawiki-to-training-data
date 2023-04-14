import Replicate from 'replicate'
import * as dotenv from 'dotenv'
dotenv.config()

// LLMs
const LLMs = {
  llama: ['llama-7b', '455d66312a66299fba685548fe24f66880f093007b927abd19f4356295f8577c'],
  gpt: ['gpt-j-6b', 'b3546aeec6c9891f0dd9929c2d3bedbf013c12e02e7dd0346af09c37e008c827'],
  flan: ['flan-t5-xl', '3ae0799123a1fe11f8c89fd99632f843fc5f7a761630160521c4253149754523']
}

// Your Replicate username/model to save the fine tuning to
// for example 'fofr/flan'
const destination = ''

// URL to your training data
const train_data = ''

// Choose your LLM (llama, gpt, flan)
const [llm, version] = LLMs.llama

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

async function main() {
  const training = await replicate.trainings.create('replicate', llm, version, {
    destination,
    input: { train_data }
  })

  console.log(training)
  console.log(`URL: https://replicate.com/p/${training.id}`)
}

const training_id = ''
async function get() {
  const training = await replicate.trainings.get(training_id)
  console.log(training)
}

async function cancel() {
  const training = await replicate.trainings.cancel(training_id)
  console.log(training)
}

main()
