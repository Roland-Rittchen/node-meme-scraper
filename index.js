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
async function clrFolder() {
  await Fs.mkdir(directory, (err) => {
    if (err) throw err;
    console.log('Directory created successfully!');
  });
  Fs.readdir(directory, (er, files) => {
    if (er) throw er;
    for (const file of files) {
      Fs.unlink(Path.join(directory, file), (err) => {
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
  const $ = cheerio.load(siteHtml); // Load HTML we fetched previously
  const listItems = $('img'); // Select all the img items in plainlist class
  const list = [];
  for (let i = 0; i < num; i++) {
    // extract list of img links, num defines how many links are put in the list
    let imgUrl = listItems[i]['attribs']['src'];
    imgUrl = imgUrl.replace('?width=300', ''); // cleanup link - removing the formatting part in the html
    list.push(imgUrl);
  }
  return list;
}

// function for the progress bar
function printProgress(total) {
  process.stdout.clearLine(); // clear the line of the old progress bar
  process.stdout.cursorTo(0); // reset the cursor to the beginning of the line
  progress += '###'; // add to the progress barr
  let space = '';
  for (let k = progress.length / 3; k <= total - 1; k++) {
    space += '   '; // fill the remainder of the space to 100% with white space
  }
  process.stdout.write('[' + progress + space + ']'); // printout the new progress bar
}

// function to download a given image from a url
async function downloadImage(durl, j) {
  const path = Path.resolve(directory, ('0' + (j + 1)).slice(-2) + '.jpg'); // create the path to where the image is saved, incl filename
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

// function to get a full list of available templates
async function getTemplates(siteUrl) {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(siteUrl);
    return data;
  } catch (err) {
    console.error(err);
  }
}

// function to check if there is a template for a given term
async function isTemplate(requested, baseUrl) {
  const answer = await getTemplates(baseUrl + 'templates?animated=false'); // get the list of all available templates
  const ansArr = answer.filter(function (el) {
    return el.id === requested; // see if the request is in the list of templates
  });
  if (ansArr.length > 0) {
    return ansArr; // if template exists return the template id
  } else {
    return 'error'; // if template does not exist return error
  }
}

// create a meme with a given template with the top text and the bottom text
// --> very similar to downloadImage -> TO DO: integrate the two functions
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
await clrFolder();
if (!process.argv[2]) {
  // if there are no arguments given - the program will download a given number of images from the main page
  const siteHtml = await getSite(mainUrl); // download the entire html code of a page
  const linkList = getImgUrls(siteHtml, number); // extract the given number of image urls
  linkList.forEach(downloadImage); // download the images
} else {
  // Expected input format: node index.js hello karl bender
  const meme = process.argv[4]; // the requested meme template
  const top = process.argv[2]; // top text for the meme to be created
  const bot = process.argv[3]; // bottom text for the meme to be created

  const resp = await isTemplate(meme, reqUrl); // check if the requested meme template is available
  if (resp === 'error') {
    console.log(`No meme was found for your input of ${meme}`); // if template unavailable tell the user
  } else {
    await createMeme(reqUrl + 'images', resp[0].id, top, bot); // template available -> create the meme and save it
    console.log('Success! Your custom meme was saved in the local folder!'); // inform the user
  }
}
