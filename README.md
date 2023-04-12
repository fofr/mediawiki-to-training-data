# Generate training data from a MediaWiki XML file

Creates a `.jsonl` file in the format:

```json
{"prompt":"Question","completion":"Answer"}
```

This data can be used to fine tune a large language model.

This process uses GPT3.5 to generate training data. The data can only be used to create models that do not compete with OpenAI, as per the OpenAI terms of service.

## Usage

Clone the repo and install dependencies:

```sh
git clone https://github.com/fofr/mediawiki-to-training-data
cd mediawiki-to-training-data
npm install
```

Then copy your [OpenAI API key](https://platform.openai.com/account/api-keys) and add it to a `.env` file:

```sh
echo "OPENAI_API_KEY=<your-key-here>" > .env
```

### Download MediaWiki content

You can download MediaWiki XMLs file from any MediaWiki site, Wikipedia being the most well-known of these.

To download an individual article from Wikipedia, use URLs in this format: `https://en.wikipedia.org/wiki/Special:Export/Title_of_the_article`

Examples:

- https://en.wikipedia.org/wiki/Special:Export/Natural_language_processing
- https://en.wikipedia.org/wiki/Special:Export/Super_Mario_Bros.
- https://en.wikipedia.org/wiki/Special:Export/Neo_(The_Matrix)

### Parse XML

Split a MediaWiki XML file into files.

Usage:

```sh
node splitXML.js your-media-wiki-file.xml
```

Will write a text file for each Wiki page into the `pages/` directory.

Long pages get chunked into separate files, a maximum of 10,000 characters each. Chunks break on newlines, and each chunk keeps the title for context.

MediaWiki redirects and pages such as users, talk pages and files, are all ignored.

### Generate training data

Use the OpenAI API to pass MediaWiki content to GPT3.5, and ask it to create questions and answers based on the information given. The WikiText formatting is passed directly to GPT as it can interpret it.

```sh
node generate-training.js
```

A maximum of 10 questions are requested per file, shorter content gets fewer questions.

JSONL is requested. If GPT returns invalid JSON the output is not saved.

A `.jsonl` file is created for each text file in `training_data/`.

You can pause and resume the generation of training data. Pages with a corresponding `.jsonl` file are skipped.

## Combine training data

When you have enough training data, combine them into a single `.jsonl` file for training.

```sh
node combine.js your-output-file.jsonl
```
