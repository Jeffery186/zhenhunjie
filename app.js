const { manhuaRssHub } = require("./util/manhua2");
const issue = require("./util/issue.js");

// run weekly at 00:01 UTC
const run = async () => {
    const zhenhunjies = await manhuaRssHub({
        url: "https://m.gufengmh8.com/manhua/zhenhunjie/",
        // url: "http://m.taduo.net/manhua/20/",
    });
    for (let i = 0; i < zhenhunjies.length; i++) {
        const element = zhenhunjies[i];
        const res = await issue.open({
            owner: "xiaojia21190",
            repo: "zhenhunjie",
            title: `${element.title}`,
            body: element.imageData.join(" "),
        });

        const issueNumber = res.data.number;

        await issue.lock({
            owner: "xiaojia21190",
            repo: "zhenhunjie",
            issueNumber,
        });
    }
};

run();
