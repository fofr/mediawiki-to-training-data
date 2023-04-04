# wiki-xml-parser

Split out a MediaWiki XML file into files

Usage:

```
node splitXML.js your-media-wiki-file.xml
```

Will write a JSON file for each Wiki page into the `output/` directory.

It ignores redirects and pages starting with:

- User:
- User talk:
- User blog:
- User blog comment:
- MediaWiki:
- File:
- Talk:
- Forum:
