const crypto = require("crypto")
const { searchHistoryUtil } = require("../utils/searchHistory.util")

const MAX_HISTORY = 50

const saveSearchHistory = (query, results) => {

    const historyItem = {
        id: crypto.randomUUID(),
        query,
        results,
        createdAt: new Date().toISOString()
    }

    searchHistoryUtil.unshift(historyItem)

    if (searchHistoryUtil.length > MAX_HISTORY) {
        searchHistoryUtil.pop()
    }

}


const getSearchHistory = () => {

    return searchHistoryUtil

}


module.exports = {
    saveSearchHistory,
    getSearchHistory
}