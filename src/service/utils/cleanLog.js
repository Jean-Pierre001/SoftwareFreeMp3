function cleanLog(data) {
    return data.toString().replace(/[\r\n]+/g, "").trim();
}