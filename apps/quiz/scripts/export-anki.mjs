import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadQuestionBank } from './question-bank.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const outputPath = path.join(repoRoot, 'exports', 'anki', 'dp700-anki-import.tsv');
const consolidatedReviewPath = path.join(repoRoot, 'files', 'DP-700 Consolidated Review.txt');

const pdfCards = [
  {
    front: 'In Microsoft Fabric, what storage format does OneLake use by default?',
    back: 'OneLake uses Delta-Parquet, which combines Parquet storage with Delta Lake table capabilities for lakehouse analytics.',
    source: 'files/Module assessment - Training _ Microsoft Learn 4.pdf',
    tags: ['pdf', 'fabric', 'onelake'],
  },
  {
    front: 'Which Fabric experience is the best match for moving and transforming data through low-code pipelines?',
    back: 'Use Data Factory when the requirement is to move, orchestrate, and transform data with pipeline and dataflow-style capabilities.',
    source: 'files/Module assessment - Training _ Microsoft Learn 4.pdf',
    tags: ['pdf', 'fabric', 'data-factory'],
  },
  {
    front: 'Why does OneLake help Fabric AI features such as Copilot and data agents?',
    back: 'The unified storage model lets AI features work over the same governed data without requiring separate copies or preparation pipelines for each tool.',
    source: 'files/Module assessment - Training _ Microsoft Learn 4.pdf',
    tags: ['pdf', 'fabric', 'onelake'],
  },
  {
    front: 'In a Fabric notebook, why define an explicit schema when reading CSV files into a Spark DataFrame?',
    back: 'An explicit schema gives columns meaningful names and data types instead of relying on generic names or inferred types that may not match the intended analytics model.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'dataframe'],
  },
  {
    front: 'How can a Fabric Spark read load all CSV files from an orders folder in one operation?',
    back: 'Use a wildcard path such as <code>Files/orders/*.csv</code> with <code>spark.read.format("csv").schema(...).load(...)</code> so every matching file is read into the DataFrame.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'dataframe'],
  },
  {
    front: 'What happens to the original DataFrame when you create a filtered or selected DataFrame in Spark?',
    back: 'DataFrame transformations return a new DataFrame. The original DataFrame is not modified by operations such as <code>select</code>, <code>where</code>, or chained transformations.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'dataframe'],
  },
  {
    front: 'Which DataFrame pattern should you use to return only customer name and email rows for one product?',
    back: 'Select the needed columns and then filter the rows, for example <code>df.select("CustomerName", "Email").where(df["Item"] == "Road-250 Red, 52")</code>.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'dataframe'],
  },
  {
    front: 'What does <code>df.select("Item", "Quantity").groupBy("Item").sum()</code> produce?',
    back: 'It groups rows by product item and returns aggregate sums for the numeric selected columns, such as total quantity by item.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'aggregation'],
  },
  {
    front: 'How do you derive a year column from <code>OrderDate</code> before grouping Spark DataFrame rows?',
    back: 'Import Spark SQL functions, use <code>year(col("OrderDate")).alias("Year")</code>, then group by the derived column and aggregate or count as needed.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'aggregation'],
  },
  {
    front: 'Which Spark functions are useful for splitting a full customer name into first and last name columns?',
    back: 'Use <code>withColumn</code> with <code>split(col("CustomerName"), " ")</code> and <code>getItem(...)</code> to derive the separate name columns.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'transformation'],
  },
  {
    front: 'When should you save transformed lakehouse data as Parquet files under <code>Files</code>?',
    back: 'Use Parquet files when the requirement is efficient file storage or file-based downstream processing, not a managed Spark catalog table.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'parquet'],
  },
  {
    front: 'Why partition large Parquet outputs by columns such as <code>Year</code> and <code>Month</code>?',
    back: 'Partitioning organizes files into folder paths by partition values, which can reduce the amount of data scanned for filters that target those values.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'partitioning'],
  },
  {
    front: 'What code pattern saves a Spark DataFrame as a managed Delta table in the Fabric lakehouse Tables area?',
    back: 'Use <code>df.write.format("delta").saveAsTable("table_name")</code>. The table is registered in the Spark catalog and stored as a managed Delta table.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'delta'],
  },
  {
    front: 'What does the <code>%%sql</code> magic do in a Fabric notebook cell?',
    back: 'It runs the cell as Spark SQL instead of PySpark, allowing direct SQL queries against catalog objects such as lakehouse Delta tables.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'sql'],
  },
  {
    front: 'When should you use built-in Fabric notebook charts instead of Python plotting libraries?',
    back: 'Use built-in charts for quick visual checks in notebook results. Use libraries such as matplotlib or seaborn when you need more control over chart layout and styling.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'visualization'],
  },
  {
    front: 'Why might Spark notebook visualization code convert a Spark DataFrame to a Pandas DataFrame?',
    back: 'Libraries such as matplotlib and seaborn operate on local Python/Pandas data structures, so charting often requires converting the Spark result after reducing it to a manageable size.',
    source: 'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf',
    tags: ['pdf', 'spark', 'visualization'],
  },
  {
    front: 'What is the Spark catalog used for?',
    back: 'The Spark catalog is a metastore for relational objects such as views and tables, letting Spark languages and Spark SQL query the same registered objects.',
    source: 'files/Work with data using Spark SQL - Training _ Microsoft Learn.pdf',
    tags: ['pdf', 'spark', 'catalog'],
  },
  {
    front: 'What is the key difference between a Spark temporary view and a persisted Spark table?',
    back: 'A temporary view is removed when the Spark session ends. A persisted table remains in the catalog and can be queried later.',
    source: 'files/Work with data using Spark SQL - Training _ Microsoft Learn.pdf',
    tags: ['pdf', 'spark', 'catalog'],
  },
  {
    front: 'What is the difference between a managed Spark table and an external Spark table in Fabric?',
    back: 'A managed table stores its underlying data in the managed Tables location, and deleting it deletes that data. An external table stores metadata in the catalog but points to data in an external location, so deleting the table does not delete the files.',
    source: 'files/Work with data using Spark SQL - Training _ Microsoft Learn.pdf',
    tags: ['pdf', 'spark', 'catalog'],
  },
  {
    front: 'Why is Delta preferred for Spark catalog tables in Microsoft Fabric?',
    back: 'Delta tables add relational-style capabilities such as transactions, versioning, and streaming support on top of lakehouse storage.',
    source: 'files/Work with data using Spark SQL - Training _ Microsoft Learn.pdf',
    tags: ['pdf', 'spark', 'delta'],
  },
  {
    front: 'What Spark pool setting helps handle varying data volumes efficiently?',
    back: 'Autoscale lets the Spark pool adjust the number of nodes based on workload size instead of forcing a fixed node count for every job.',
    source: 'files/Module assessment - Training _ Microsoft Learn 1.pdf',
    tags: ['pdf', 'spark', 'performance'],
  },
  {
    front: 'Where do you choose the Apache Spark runtime version for Fabric tasks that use a custom environment?',
    back: 'Specify the Spark runtime in the Fabric environment settings so notebooks and jobs that use that environment run on the intended runtime version.',
    source: 'files/Module assessment - Training _ Microsoft Learn.pdf',
    tags: ['pdf', 'spark', 'environment'],
  },
  {
    front: 'What is the purpose of a default Spark pool in a Fabric workspace?',
    back: 'It gives Spark jobs an automatically selected pool when the user or job does not specify a particular Spark pool.',
    source: 'files/Module assessment - Training _ Microsoft Learn 2.pdf',
    tags: ['pdf', 'spark', 'pool'],
  },
  {
    front: 'Which Fabric Spark setting directly targets query execution performance with vectorized operations?',
    back: 'Enable the native execution engine through the relevant Spark environment properties when the workload and runtime support it.',
    source: 'files/Module assessment - Training _ Microsoft Learn 1.pdf',
    tags: ['pdf', 'spark', 'performance'],
  },
  {
    front: 'What is an Eventhouse in Microsoft Fabric used for?',
    back: 'An eventhouse stores and analyzes real-time event data, often ingested from eventstreams, in one or more KQL databases.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'What does the pipe character separate in a KQL tabular expression?',
    back: 'It separates query operators so each step consumes the tabular output from the previous step, for example table input followed by <code>project</code>, <code>where</code>, or <code>summarize</code>.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'In KQL, when should you use <code>project</code>?',
    back: 'Use <code>project</code> to select, rename, or compute the columns returned by a query, which keeps the result focused on the attributes needed for analysis.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'In KQL, what is the role of <code>summarize</code>?',
    back: '<code>summarize</code> performs aggregations, optionally grouped by one or more columns or expressions, such as total bikes by neighborhood.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'How can KQL group null or empty dimension values into a readable fallback category?',
    back: 'Use <code>case</code> with checks such as <code>isempty(...)</code> and <code>isnull(...)</code> to replace missing values with a label such as <code>Unidentified</code>.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'Which KQL operators can sort query results?',
    back: 'Use <code>sort by</code> or <code>order by</code>. In the Fabric KQL examples, they behave the same for ordering result rows.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'Which KQL operator filters rows based on a condition?',
    back: 'Use <code>where</code>, combining conditions with logical operators such as <code>and</code> and <code>or</code> when needed.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'Why is KQL usually preferred over the T-SQL endpoint for KQL databases?',
    back: 'The T-SQL endpoint exists for compatibility and has limitations. KQL is the native query language for KQL databases and generally offers fuller capability and better fit for event analytics.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'What operation types are not supported by the T-SQL endpoint for a KQL database?',
    back: 'The endpoint is for querying and does not support table DDL or data modification operations such as creating, altering, dropping, inserting, updating, or deleting data.',
    source: 'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf',
    tags: ['pdf', 'eventhouse', 'sql'],
  },
  {
    front: 'Why apply a time-based filter early in a KQL query over time-series data?',
    back: 'Filtering early reduces the amount of data that later operators must process, which is especially important for high-volume time-series tables.',
    source: 'files/Module assessment - Training _ Microsoft Learn 3.pdf',
    tags: ['pdf', 'eventhouse', 'kql-performance'],
  },
  {
    front: 'How do materialized views improve KQL database query performance?',
    back: 'They maintain precomputed aggregations or results so repeated analytical queries can read prepared data instead of recalculating from the full source each time.',
    source: 'files/Module assessment - Training _ Microsoft Learn 3.pdf',
    tags: ['pdf', 'eventhouse', 'kql-performance'],
  },
  {
    front: 'What is the purpose of stored functions in KQL analysis?',
    back: 'Stored functions encapsulate reusable query logic so repeated calculations stay consistent across analysts, dashboards, and operational queries.',
    source: 'files/Module assessment - Training _ Microsoft Learn 3.pdf',
    tags: ['pdf', 'eventhouse', 'kql'],
  },
  {
    front: 'Which feature lets a KQL database in an eventhouse query data from Azure Data Explorer without copying it into the database?',
    back: 'Use a database shortcut when the goal is to reference an Azure Data Explorer database from the eventhouse KQL database.',
    source: 'files/Module assessment - Training _ Microsoft Learn 3.pdf',
    tags: ['pdf', 'eventhouse', 'shortcut'],
  },
  {
    front: 'Why place the smaller table first when designing some KQL joins?',
    back: 'Putting the smaller side first can reduce rows processed during the join and improve query efficiency.',
    source: 'files/Module assessment - Training _ Microsoft Learn 3.pdf',
    tags: ['pdf', 'eventhouse', 'kql-performance'],
  },
];

const sourceUrlByPdfPath = {
  'files/Analyze data with Apache Spark in Fabric _ mslearn-fabric.pdf':
    'https://microsoftlearning.github.io/mslearn-fabric/Instructions/Labs/02-analyze-spark.html',
  'files/Module assessment - Training _ Microsoft Learn.pdf':
    'https://learn.microsoft.com/en-us/training/modules/use-apache-spark-work-files-lakehouse/8-knowledge-check',
  'files/Module assessment - Training _ Microsoft Learn 1.pdf':
    'https://learn.microsoft.com/en-us/training/modules/use-apache-spark-work-files-lakehouse/8-knowledge-check',
  'files/Module assessment - Training _ Microsoft Learn 2.pdf':
    'https://learn.microsoft.com/en-us/training/modules/use-apache-spark-work-files-lakehouse/8-knowledge-check',
  'files/Module assessment - Training _ Microsoft Learn 3.pdf':
    'https://learn.microsoft.com/en-us/training/modules/query-data-kql-database-microsoft-fabric/6-knowledge-check',
  'files/Module assessment - Training _ Microsoft Learn 4.pdf':
    'https://learn.microsoft.com/en-us/training/modules/introduction-end-analytics-use-microsoft-fabric/5-knowledge-check',
  'files/Work with data in a Microsoft Fabric eventhouse _ mslearn-fabric.pdf':
    'https://microsoftlearning.github.io/mslearn-fabric/Instructions/Labs/12-query-data-in-kql-database.html',
  'files/Work with data using Spark SQL - Training _ Microsoft Learn.pdf':
    'https://learn.microsoft.com/en-us/training/modules/use-apache-spark-work-files-lakehouse/5-spark-sql',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function paragraphs(value) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => inlineMarkdown(paragraph.trim()).replace(/\n/g, '<br>'))
    .join('<br><br>');
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function tagsForQuestion(question) {
  return [
    'dp700',
    'question-bank',
    question.id.toLowerCase(),
    `domain-${slug(question.domain)}`,
    `difficulty-${slug(question.difficulty)}`,
    `topic-${slug(question.topic)}`,
  ];
}

function sourceLink(url) {
  return `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`;
}

function questionCard(question) {
  const choices = question.choices
    .map((choice) => `<li><strong>${choice.label}.</strong> ${inlineMarkdown(choice.text)}</li>`)
    .join('');
  const reasons = question.choices
    .map((choice) => `<li><strong>${choice.label}.</strong> ${paragraphs(question.reasons[choice.label])}</li>`)
    .join('');
  const source = `<br><br><strong>Source:</strong> ${escapeHtml(
    question.source.title,
  )}<br><strong>Link:</strong> ${sourceLink(question.source.url)}`;

  return {
    front: `<strong>${question.id}: ${escapeHtml(question.title)}</strong><br><br>${paragraphs(
      question.prompt,
    )}<br><br><ol type="A">${choices}</ol>`,
    back: `<strong>Correct answer:</strong> ${question.correctAnswer}. ${inlineMarkdown(
      question.correctAnswerText,
    )}<br><br><strong>Explanation:</strong><br>${paragraphs(
      question.explanation,
    )}<br><br><strong>Choice reasoning:</strong><ul>${reasons}</ul>${source}`,
    tags: tagsForQuestion(question),
  };
}

function pdfConceptCard(card) {
  const url = sourceUrlByPdfPath[card.source];
  const link = url ? `<br><strong>Link:</strong> ${sourceLink(url)}` : '';

  return {
    front: `<strong>PDF concept:</strong> ${card.front}`,
    back: `${card.back}<br><br><strong>Source:</strong> ${escapeHtml(card.source)}${link}`,
    tags: ['dp700', 'pdf-source', ...card.tags],
  };
}

function splitTsvLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === '\t' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += character;
    }
  }

  fields.push(field);
  return fields;
}

function loadConsolidatedReviewCards() {
  if (!fs.existsSync(consolidatedReviewPath)) return [];

  const content = fs.readFileSync(consolidatedReviewPath, 'utf8').replace(/\r\n/g, '\n');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, index) => {
      const [front, back] = splitTsvLine(line);
      if (!front || !back) {
        throw new Error(`Invalid consolidated review card at row ${index + 1}`);
      }

      return {
        front: `<strong>Consolidated review:</strong> ${front}`,
        back: `${back}<br><br><strong>Source file:</strong> ${path.relative(repoRoot, consolidatedReviewPath)}`,
        tags: ['dp700', 'consolidated-review'],
      };
    });
}

function tsvField(value) {
  return String(value).replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
}

function serializeCard(card) {
  return [card.front, card.back, card.tags.join(' ')].map(tsvField).join('\t');
}

function normalizedFront(front) {
  return front
    .replace(/^<strong>(?:PDF concept|Consolidated review):<\/strong>\s*/i, '')
    .replace(/^<strong>DP700-\d{3}:[^<]+<\/strong><br><br>/i, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function uniqueCards(cards) {
  const seen = new Map();
  const skipped = [];

  for (const card of cards) {
    const key = normalizedFront(card.front);
    const existing = seen.get(key);
    if (existing) {
      skipped.push({ duplicate: card, kept: existing });
    } else {
      seen.set(key, card);
    }
  }

  return {
    cards: [...seen.values()],
    skipped,
  };
}

const { questions } = loadQuestionBank(repoRoot);
const consolidatedReviewCards = loadConsolidatedReviewCards();
const sourceCards = [...questions.map(questionCard), ...pdfCards.map(pdfConceptCard), ...consolidatedReviewCards];
const { cards, skipped } = uniqueCards(sourceCards);
const header = ['#separator:tab', '#html:true', '#notetype:Basic', '#deck:DP-700', '#tags column:3'];
const output = `${header.join('\n')}\n${cards.map(serializeCard).join('\n')}\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`Wrote ${cards.length} Anki cards to ${path.relative(repoRoot, outputPath)}`);
console.log(`Source cards: ${sourceCards.length}`);
console.log(`Question cards: ${questions.length}`);
console.log(`PDF concept cards: ${pdfCards.length}`);
console.log(`Consolidated review cards: ${consolidatedReviewCards.length}`);
console.log(`Skipped duplicate fronts: ${skipped.length}`);
for (const skippedCard of skipped) {
  console.log(`- ${normalizedFront(skippedCard.duplicate.front)}`);
}
