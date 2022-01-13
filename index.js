import Fs from 'node:fs';
import Path from 'node:path';
import axios from 'axios';
import cheerio from 'cheerio';

const url = 'https://memegen-link-examples-upleveled.netlify.app/'; // url to the website to be scraped
const number = 10; // number of memes you want to scrape
const directory = `C:\\Users\\rritt\\projects\\node-meme-scraper`; // directory of the program

let progress = '';

function clrFolder() {
  const subdir = directory + `\\memes\\`;
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
  // console.log(siteHtml);
  // Load HTML we fetched in the previous line
  const $ = cheerio.load(siteHtml);
  // Select all the list items in plainlist class
  const listItems = $('img');
  // extract first 10 img links
  const list = [];
  for (let i = 0; i < num; i++) {
    let imgUrl = listItems[i]['attribs']['src'];
    // cleanup link
    imgUrl = imgUrl.replace('?width=300', '');
    // console.log(imgUrl);
    list.push(imgUrl);
  }
  return list;
}

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

async function downloadImage(durl, j) {
  const path = Path.resolve(
    directory,
    'memes',
    ('0' + (j + 1)).slice(-2) + '.jpg',
  );
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

clrFolder();
const urlSite = await getSite(url);
const linkList = getImgUrls(urlSite, number);
linkList.forEach(downloadImage);
