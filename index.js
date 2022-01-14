import Fs from 'node:fs';
import Path from 'node:path';
import axios from 'axios';
import cheerio from 'cheerio';

// global parameters for the program
const mainUrl = 'https://memegen-link-examples-upleveled.netlify.app/'; // url to the website to be scraped
const reqUrl = `https://api.memegen.link/`; // url to create memes
const number = 10; // number of memes you want to scrape
const directory = `.\\memes\\`; // directory to save the files   hardcoded option `C:\\Users\\rritt\\projects\\node-meme-scraper\\memes\\`

// initialize the progress bar to zero
let progress = '';

// function to clear out the memes folder to avoid file conflicts
function clrFolder() {
  const subdir = directory;
  Fs.readdir(subdir, (er, files) => {
    if (er) throw er;

    for (const file of files) {
      Fs.unlink(Path.join(subdir, file), (err) => {
        if (err) throw err;
      });
    }
  });
}

// function to get entire html code from the website provided
async function getSite(siteUrl) {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(siteUrl);
    return data;
  } catch (err) {
    console.error(err);
  }
}

// function extracting image urls from html text
function getImgUrls(siteHtml, num) {
  // Load HTML we fetched previously
  const $ = cheerio.load(siteHtml);
  // Select all the img items in plainlist class
  const listItems = $('img');
  // extract first number of img links
  const list = [];
  for (let i = 0; i < num; i++) {
    let imgUrl = listItems[i]['attribs']['src'];
    // cleanup link
    imgUrl = imgUrl.replace('?width=300', '');
    list.push(imgUrl);
  }
  return list;
}

// function for the progress bar
function printProgress(total) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  progress += '###';
  let space = '';
  for (let k = progress.length / 3; k <= total - 1; k++) {
    space += '   ';
  }
  process.stdout.write('[' + progress + space + ']');
}

// function to download a given image from a url
async function downloadImage(durl, j) {
  const path = Path.resolve(directory, ('0' + (j + 1)).slice(-2) + '.jpg');
  const writer = Fs.createWriteStream(path);
  const response = await axios({
    url: durl,
    method: 'GET',
    responseType: 'stream',
  });
  response.data.pipe(writer);
  printProgress(progress);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function getTemplates(siteUrl) {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(siteUrl);
    return data;
  } catch (err) {
    console.error(err);
  }
}

async function isTemplate(requested, baseUrl) {
  const answer = await getTemplates(baseUrl + 'templates?animated=false');
  const ansArr = answer.filter(function (el) {
    return el.id === requested;
  });
  if (ansArr.length > 0) {
    return ansArr;
  } else {
    return 'error';
  }
}

async function createMeme(createMemeUrl, tempID, topStr, botStr) {
  try {
    const path = Path.resolve(directory, 'custom.jpg');
    const writer = Fs.createWriteStream(path);
    const submitObj = {
      template_id: tempID,
      text_lines: [topStr, botStr],
      style: ['string'],
      extension: 'string',
      redirect: true,
    };
    const response = await axios({
      method: 'post',
      url: createMemeUrl,
      data: submitObj,
      responseType: 'stream',
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.log(error);
  }
}

// --------------------------------------------------------
// MAIN LOGIC
// --------------------------------------------------------
clrFolder();
if (!process.argv[2]) {
  const urlSite = await getSite(mainUrl);
  const linkList = getImgUrls(urlSite, number);
  linkList.forEach(downloadImage);
} else {
  // Expected input format: node index.js hello karl bender
  const meme = process.argv[4];
  const top = process.argv[2];
  const bot = process.argv[3];

  const resp = await isTemplate(meme, reqUrl);
  if (resp === 'error') {
    console.log(`No meme was found for your input of ${meme}`);
  } else {
    await createMeme(reqUrl + 'images', resp[0].id, top, bot);
    console.log('Success! Your custom meme was saved in the local folder!');
  }
}
