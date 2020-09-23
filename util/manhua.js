const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require("puppeteer");
const userAgent = require("../util/user_agents");

let Brower;

const pageBrower = async () => {
    if (Brower) {
        return Brower;
    }
    try {
        Brower = await puppeteer.launch({
            headless: true,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-first-run",
                "--no-sandbox",
                "--no-zygote",
                // "--single-process",
                "--start-maximized",
                "--use-gl=swiftshader",
                "--disable-gl-drawing-for-tests",
            ],
            ignoreDefaultArgs: ["--enable-automation"],
        });
        return Brower;
    } catch (error) {
        await Brower.close();
    }
};

const detailManHua = async (search) => {
    let dataList = {};
    let browser = await pageBrower();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(240 * 1000);
    try {
        await Promise.all([
            page.setUserAgent(userAgent.random()),
            page.setJavaScriptEnabled(true), //  允许执行 js 脚本
            page.goto(search.url, {
                waitUntil: "domcontentloaded",
            }),
            page.waitFor(2000),
        ]);
        const context = await page.content();
        const $ = cheerio.load(context, {
            ignoreWhitespace: true,
            normalizeWhitespace: true,
        });

        let catlogs = [];

        let items = $(".chapter-list a");
        items.each((i, element) => {
            let href = $(element).attr("href");
            let url = `http://m.taduo.net${href}`;
            let text = $(element).attr("title");
            catlogs.push({
                url,
                text,
            });
        });

        dataList = {
            catlogs: catlogs.reverse(),
        };
        await page.close();
        return dataList;
    } catch (error) {
        await page.close();
        console.log(error);
    }
};

const base64decode = (str) => {
    var base64EncodeChars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var base64DecodeChars = new Array(
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        62,
        -1,
        -1,
        -1,
        63,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        -1,
        -1,
        -1,
        -1,
        -1
    );
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        do {
            c1 = base64DecodeChars[str.charCodeAt(i++) & 255];
        } while (i < len && c1 == -1);
        if (c1 == -1) {
            break;
        }
        do {
            c2 = base64DecodeChars[str.charCodeAt(i++) & 255];
        } while (i < len && c2 == -1);
        if (c2 == -1) {
            break;
        }
        out += String.fromCharCode((c1 << 2) | ((c2 & 48) >> 4));
        do {
            c3 = str.charCodeAt(i++) & 255;
            if (c3 == 61) {
                return out;
            }
            c3 = base64DecodeChars[c3];
        } while (i < len && c3 == -1);
        if (c3 == -1) {
            break;
        }
        out += String.fromCharCode(((c2 & 15) << 4) | ((c3 & 60) >> 2));
        do {
            c4 = str.charCodeAt(i++) & 255;
            if (c4 == 61) {
                return out;
            }
            c4 = base64DecodeChars[c4];
        } while (i < len && c4 == -1);
        if (c4 == -1) {
            break;
        }
        out += String.fromCharCode(((c3 & 3) << 6) | c4);
    }
    return out;
};

const getImages = async (search) => {
    let dataList = [];
    try {
        let response = await axios.default.get(search.url, {
            headers: { "User-Agent": userAgent.random() },
        });

        // 找到sub
        let context = response.data;
        let chapterImagesReg = /cp=\"(.*?)\"/g;
        let chapterImages = chapterImagesReg.exec(context)[1];
        let imagesText = eval(base64decode(chapterImages).slice(4));
        let chapterImagesReg1 = /\[(.*?)\]/g;
        let images = eval(chapterImagesReg1.exec(imagesText)[0]);
        images.map((res) => {
            dataList.push(`http://omh.jiduo.cc/${res}`);
        });

        return dataList;
    } catch (error) {
        console.log(error);
    }
};

const manhuaRssHub = async (search) => {
    let queryData = [];
    console.log("爬取中---------------------");
    let dataList = await detailManHua(search);

    for (const key in dataList.catlogs) {
        if (dataList.catlogs.hasOwnProperty(key)) {
            const element = dataList.catlogs[key];
            let result = await getImages({
                url: element.url,
            });

            queryData.push({
                url: element.url,
                imageData: result,
                title: element.text,
            });
        }
    }
    // 单机测试
    // let result = await getImages({
    //     url: dataList.catlogs[0].url,
    // });

    // queryData.push({
    //     url: dataList.catlogs[0].url,
    //     imageData: result,
    //     title: dataList.catlogs[0].text,
    // });

    for (var key in queryData) {
        for (let i = 0; i < queryData[key].imageData.length; i++) {
            queryData[key].imageData[
                i
            ] = `![${i}](${queryData[key].imageData[i]})`;
        }
    }

    console.log("爬取完毕---------------------");

    return queryData;
};

module.exports = { manhuaRssHub };
