const cheerio = require("cheerio");
const axios = require("axios").default;
const puppeteer = require("puppeteer");
const userAgent = require("../util/user_agents");
const issue = require("./issue.js");

const detailManHua = async (search) => {
    let dataList = {};
    let browser;
    try {
        browser = await puppeteer.launch({
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
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(240 * 1000);
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

        // 找到sub
        let cover = $("#Cover mip-img img").attr("src");
        let sub = $(".comic-view .pic .pic_zi");
        let gengxin = sub
            .eq(0)
            .text()
            .replace(/[ ]|\n|\t/g, "");
        let author = sub
            .eq(1)
            .text()
            .replace(/[ ]|\n|\t/g, "");
        let leixing = sub
            .eq(2)
            .text()
            .replace(/[ ]|\n|\t/g, "");
        let gengxinTime = sub
            .eq(3)
            .text()
            .replace(/[ ]|\n|\t/g, "");
        let content = $(".comic-view p").text();

        let catlogs = [];

        let items = $(".comic-view .Drama li");
        items.each((i, element) => {
            let url = `https://m.gufengmh9.com/${$(element)
                .find("a")
                .attr("href")}`;
            let text = $(element).find("span").text();
            catlogs.push({
                url,
                text,
            });
        });

        // 处理catlog
        let cat1 = catlogs.slice(0, 225);
        let cat2 = catlogs.slice(399, 461);
        let cat3 = catlogs.slice(516, 521);
        let cat4 = catlogs.slice(693, catlogs.length);
        catlogs = cat1.concat(cat2).concat(cat3).concat(cat4);

        dataList = {
            url: search.url,
            cover,
            gengxin,
            author,
            leixing,
            gengxinTime,
            content,
            catlogs,
        };
        await browser.close();
        return dataList;
    } catch (error) {
        await browser.close();
        console.log(error);
    }
};

const getImages = async (search) => {
    let dataList = [];
    try {
        let response = await axios.get(search.url, {
            headers: { "User-Agent": userAgent.random() },
        });

        // 找到sub
        let context = response.data;
        let chapterImagesReg1 = /chapterImages = \["(.*?)\"]/g;
        let chapterImages = chapterImagesReg1.exec(context)[1].split(",");

        let chapterImagesReg2 = /chapterPath = \"(.*?)\"/g;
        let chapterImagesPrev = chapterImagesReg2.exec(context)[1];
        chapterImages.map((res) => {
            dataList.push(
                `https://res.xiaoqinre.com/${chapterImagesPrev}${res.replace(
                    /"/g,
                    ""
                )}`
            );
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
    let result = await issue.list({
        owner: "xiaojia21190",
        repo: "zhenhunjie",
    });
    console.log("all issue =========");
    console.log(result.data[0].number);

    let slicelen = result.data[0].number - 57;
    if (dataList.catlogs.length === slicelen) return queryData;
    if (dataList.catlogs.length > slicelen) {
        let catlogs = dataList.catlogs.slice(slicelen, dataList.catlogs.length);
        for (const key in catlogs) {
            if (catlogs.hasOwnProperty(key)) {
                const element = catlogs[key];
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
    }

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
