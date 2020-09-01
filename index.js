const fs = require("fs");
const pdf = require("@touno-io/pdf");
const express = require("express");
var natural = require("natural");
const app = express();
const port = process.env.PORT || 3000;
const GoogleImages = require("google-images");
const nlp = require("compromise");
var gis = require("g-i-s");
var cors = require("cors");
const path = require("path");
const axios = require("axios");
Tokenizer = require("nalapa").tokenizer;
var multer = require("multer");
const jwt = require("jsonwebtoken");
var randomWords = require("random-words");
require("dotenv").config();
var ImageScraper = require("bing-image-scraper");
const LanguageDetect = require("languagedetect");
const lngDetector = new LanguageDetect();
const yts = require("yt-search");
var keyword_extractor = require("keyword-extractor");

async function checkImageAbleToOpen(imageUrl) {
  try {
    const response = await axios.get(imageUrl);
    return response != 200 ? 200 : 404;
  } catch (error) {
    return 404;
  }
}

function img(query) {
  return new Promise((resolve) => {
    gis(query, async function logResults(error, results) {
      if (error) {
        resolve({
          url:
            "https://www.bookwallah.org/wp-content/uploads/2015/09/no-img-300x188.jpg",
        });
      } else {
        for (let i = 0; i < results.length; i++) {
          if ((await checkImageAbleToOpen(results[i].url)) == 200) {
            resolve(results[i]);
            break;
          }
        }
      }
    });
  });
}

function getKeyword(query) {
  return new Promise((resolve, reject) => {
    let sentence = nlp(query);
    topics = sentence.topics().json();

    if (topics.length > 0) {
      resolve(
        topics
          .map(function (elem) {
            return elem.text.replace(/[^a-zA-Z ]/g, "");
          })
          .join(" "),
      );
    } else {
      resolve(query);
    }
  });
}

var storage_pdf = multer.memoryStorage();

// var upload_pdf = multer({
//     storage: storage_pdf,
//     fileFilter: function (req, file, callback) {
//         var ext = path.extname(file.originalname);
//         if (ext !== ".pdf") {
//             return callback(null, false);
//         }
//         callback(null, true);
//     },
// });

const upload_pdf = multer();

function shuffleArray(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var verifyJWT = function (req, res, next) {
  const bearerHeader = req.headers.authorization;
  const token = bearerHeader ? bearerHeader.split(" ")[1] : undefined;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, function (err, payload) {
      if (err) {
        return res
          .status(401)
          .json("Maaf silahkan login untuk melanjutkan.");
      } else {
        req.payload = payload;
        next();
      }
    });
  } else {
    return res.status(401).json("Maaf silahkan login untuk melanjutkan.");
  }
};
async function checkImageAbleToOpen(imageUrl) {
  try {
    const response = await axios.get(imageUrl);
    return response != 200 ? 200 : 404;
  } catch (error) {
    return 404;
  }
}

app.use("/files", express.static("files"));
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  );
  // allow preflight

  if (req.method === "OPTIONS") {
    res.send(200);
  } else {
    next();
  }
});

const client = new GoogleImages(
  "009039845094310497023:weh5dj4jjnk",
  "AIzaSyB8pYQPY6KLDx7SVreOILwwPYdYreh4SUo",
);

app.use(express.json({ limit: "50mb", extended: true }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
    parameterLimit: 500000,
  }),
);

const reduceNoun = async (text) => {
  return await nlp(text).nouns().json();
};

const blankGenText = async (str, text) => {
  return await text.toLowerCase().replace(str, "____");
};

function get_question(sentence) {
  return new Promise((resolve, reject) => {
    let qa_array = [];
    reduceNoun(sentence)
      .then((data) => {
        data.map(async (str) => {
          blankGenText(str.text.toLowerCase(), sentence)
            .then((ques) => {
              let answersArrayOneString = randomWords({
                exactly: 3,
                wordsPerString: 1,
              });
              let answersArrayTwoString = randomWords({
                exactly: 3,
                wordsPerString: 2,
              });
              let answersArrayThreeString = randomWords({
                exactly: 3,
                wordsPerString: 3,
              });
              let answersArrayFourString = randomWords({
                exactly: 3,
                wordsPerString: 4,
              });

              let allAnswerArray = [].concat(
                answersArrayOneString,
                answersArrayTwoString,
                answersArrayThreeString,
                answersArrayFourString,
              );

              let allAnswerArrayGetLimit = allAnswerArray
                .slice(0, 4)
                .map(function () {
                  return this.splice(
                    Math.floor(Math.random() * this.length),
                    1,
                  )[0];
                }, allAnswerArray.slice());

              allAnswerArrayGetLimit.push(
                str.text.replace(/[^\w\s]/gi, "").toLowerCase(),
              );

              qa_array.push({
                question: ques == "____"
                  ? "What is the correct statement?"
                  : ques,
                correct_answer: str.text
                  .replace(/[^\w\s]/gi, "")
                  .toLowerCase(),
                answers: shuffleArray(allAnswerArrayGetLimit),
              });
            })
            .catch((err) => reject(err));
        });
        resolve(qa_array);
      })
      .catch((err) => reject(err));
  });
}

function img(query) {
  return new Promise((resolve) => {
    gis(query, async function logResults(error, results) {
      if (error) {
        resolve({
          url:
            "https://www.bookwallah.org/wp-content/uploads/2015/09/no-img-300x188.jpg",
        });
      } else {
        for (let i = 0; i < results.length; i++) {
          if ((await checkImageAbleToOpen(results[i].url)) == 200) {
            resolve(results[i]);
            break;
          }
        }
      }
    });
  });
}

app.get("/", async (req, res) => {
  let image = await getKeyword("First President of Indonesia Soekarno");
  return res.json(image);
});
app.post("/", verifyJWT, upload_pdf.single("pdf"), async (req, res) => {
  if (req.file == undefined) {
    return res.status(403).json("Invalid extension and/or pdf required.");
  }

  let filename = req.file.originalname;
  let dataBuffer = req.file.buffer;

  let videoKeyword = filename.split(".pdf")[0].replace(/[^a-zA-Z ]/g, " ");

  let ytVideos = await yts(videoKeyword);
  let videosReference = JSON.stringify(ytVideos.videos.slice(0, 4));

  pdf(dataBuffer).then(async function (data) {
    text = data.text.replace(/(\r\n|\n|\r)/gm, "");
    text = text.replace(/(\r\t|\t|\r)/gm, " ");
    text = text.replace(/  +/g, " ");
    let paragraph_array = Tokenizer.splitSentence(text);

    let split_sentence_array = paragraph_array.map(function (paragraph) {
      natural.PorterStemmer.attach();
      let split_sentence = Tokenizer.splitSentence(paragraph);
      return {
        sentence: paragraph,
        split_sentence: split_sentence,
      };
    });

    let data_result = [];
    let language = lngDetector.detect(
      split_sentence_array[0].sentence,
    )[0][0];
    for (let i = 0; i < split_sentence_array.length; i++) {
      let sentence = split_sentence_array[i].sentence;
      let split_sentence = split_sentence_array[i].split_sentence;
      let split = split_sentence[0].split(" or ")[0];
      let sentence_split = sentence.split(",");
      let keywordImage = await getKeyword(split_sentence[0]);
      let image = null;
      //  Extract the keywords
      var extraction_result = keyword_extractor.extract(keywordImage, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: false,
      });

      image = await img(split.split(",")[0]);

      data_result.push({
        sentence: sentence,
        sentence_split: sentence_split,
        split: split,
        image: image,
        question: await get_question(sentence),
      });
      console.log(i);
    }

    let json = JSON.stringify(data_result);

    let formData = {
      userid: req.payload.sub,
      title: filename,
      text: json,
      language: language,
      video_reference: videosReference,
    };

    axios
      .post(process.env.BACKEND_ENDPOINT + "cores", formData)
      .then(function (response) {
        return res.json(response.data);
      })
      .catch(function (error) {
        return res.json(error);
      });
  });
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/text2speech.html"));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
