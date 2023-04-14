import Replicate from 'replicate'
import * as dotenv from 'dotenv'
dotenv.config()

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

const DESTINATION_MODEL = 'fofr/star-trek-flan'

async function main() {
  const training = await replicate.trainings.create('replicate', 'flan-t5-xl', '3ae0799123a1fe11f8c89fd99632f843fc5f7a761630160521c4253149754523', {
    destination: DESTINATION_MODEL,
    input: {
      train_data: 'URL'
    }
  })

  console.log(training)
}

main()