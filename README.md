# Generate training data from a MediaWiki XML file

Creates a `.jsonl` file in the format:

```json
{"prompt":"Question","completion":"Answer}
```

Training data can only be used to create models that do not compete with OpenAI, as per the OpenAI terms of service.

## Parse XML

Split a MediaWiki XML file into files.

Usage:

```sh
node splitXML.js your-media-wiki-file.xml
```

Will write a text file for each Wiki page into the `output/` directory.

Long pages get chunked into separate files, a maximum of 10,000 characters each. Chunks break on newlines, and each chunk keeps the title for context.

MediaWiki redirects and pages such as users, talk pages and files, are ignored.

## Generate training data

Use the OpenAI API to pass MediaWiki content to GPT3.5, and ask it to create questions and answers based on the information given. The WikiText formatting is passed directly to GPT as it can interpret it.

A maximum of 10 questions are requested per file, shorter content gets fewer questions.

JSON is requested. If GPT returns invalid JSON the output is not saved.

A `.jsonl` file is created for each text file in `output/`
