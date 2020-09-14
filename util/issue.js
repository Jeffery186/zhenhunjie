const axios = require("axios");

let secrets = {};

try {
    secrets = require("../secret.js");
} catch (error) {
    console.log("no secret json, on github action");
}

const instance = axios.create({
    baseURL: "https://api.github.com",
    timeout: 5000,
    headers: {
        Authorization: secrets.Authorization || process.env.Authorization,
        "content-type": "application/json",
    },
});

const open = async ({ owner, repo, title, body }) => {
    try {
        console.log("opening issue");
        const res = await instance.post(`/repos/${owner}/${repo}/issues`, {
            title,
            body,
        });
        console.log("opened");
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const list = async ({ owner, repo }) => {
    try {
        console.log("list issue");
        const res = await instance.get(`/repos/${owner}/${repo}/issues`);
        console.log("list");
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const lock = async ({ owner, repo, issueNumber }) => {
    console.log("locking issue");
    await instance.put(`/repos/${owner}/${repo}/issues/${issueNumber}/lock`, {
        lock_reason: "resolved",
    });
    console.log("locked");
};

module.exports = {
    open,
    list,
    lock,
};
