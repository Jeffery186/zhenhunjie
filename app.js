const { manhuaRssHub } = require("./util/manhua");
const issue = require("./util/issue.js");

// run weekly at 00:01 UTC
const run = async () => {
    const zhenhunjies = await manhuaRssHub({
        // url: "https://m.gufengmh8.com/manhua/zhenhunjie/",
        url: "http://m.taduo.net/manhua/20/",
    });
    console.log(zhenhunjies);

    let result = await issue.list({
        owner: "xiaojia21190",
        repo: "zhenhunjie",
    });
    console.log("all issue =========");
    console.log(result.data[0].number);

    let slicelen = result.data[0].number - 51;
    if (zhenhunjies.length === slicelen) return;
    if (zhenhunjies.length > slicelen) {
        let zhenhunjie = zhenhunjies.slice(slicelen, zhenhunjies.length);
        console.log("add issue =========");
        console.log(zhenhunjie.length);
        for (let i = 0; i < zhenhunjie.length; i++) {
            const element = zhenhunjie[i];
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
    }
};

run();
