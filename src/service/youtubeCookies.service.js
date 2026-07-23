const fs = require("fs")
const path = require("path")
const { app, session } = require("electron")

const COOKIES_PATH = path.join(
    app.getPath("userData"),
    "youtube-cookies.txt"
)

async function getYoutubeCookies() {

    const youtubeSession = session.fromPartition(
        "persist:youtube-session"
    )

    return await youtubeSession.cookies.get({})

}


function convertToNetscape(cookies) {

    let output = "# Netscape HTTP Cookie File\n\n"

    for (const cookie of cookies) {

        const domain = cookie.domain
        const includeSubdomains = domain.startsWith(".") ? "TRUE" : "FALSE"
        const path = cookie.path
        const secure = cookie.secure ? "TRUE" : "FALSE"

        const expiration = cookie.expirationDate
            ? Math.floor(cookie.expirationDate)
            : 0

        output += [
            domain,
            includeSubdomains,
            path,
            secure,
            expiration,
            cookie.name,
            cookie.value
        ].join("\t")

        output += "\n"

    }

    return output

}


async function saveYoutubeCookies() {

    const cookies = await getYoutubeCookies()

    const content = convertToNetscape(cookies)

    fs.writeFileSync(
        COOKIES_PATH,
        content
    )

    console.log(
        "Cookies guardadas:",
        COOKIES_PATH
    )

    return COOKIES_PATH

}


module.exports = {
    saveYoutubeCookies,
    COOKIES_PATH
}