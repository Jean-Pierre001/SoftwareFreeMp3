function cleanLog(data) {
    return data.toString().replace(/[\r\n]+/g, "").trim();
}

module.exports = {
    cleanLog
}